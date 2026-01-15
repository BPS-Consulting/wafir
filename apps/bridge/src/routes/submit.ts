import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import yaml from "js-yaml";

interface SubmitBody {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}

interface ParsedRequestData extends SubmitBody {
  screenshotBuffer?: Buffer;
  screenshotMime?: string;
}

interface WafirConfig {
  storage?: {
    type?: "issue" | "project" | "both";
    projectNumber?: number;
    owner?: string;
    repo?: string;
  };
}

const ADD_TO_PROJECT_MUTATION = `
  mutation AddToProject($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
      item { id }
    }
  }
`;

const ADD_DRAFT_TO_PROJECT_MUTATION = `
  mutation AddDraftToProject($projectId: ID!, $title: String!, $body: String) {
    addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body }) {
      projectItem { id }
    }
  }
`;

const FIND_PROJECT_QUERY = `
  query FindProject($owner: String!, $number: Int!) {
    organization(login: $owner) { projectV2(number: $number) { id } }
    user(login: $owner) { projectV2(number: $number) { id } }
  }
`;

/**
 * Parses the incoming request, handling both Multipart and JSON bodies.
 */
async function parseSubmitRequest(
  request: FastifyRequest
): Promise<ParsedRequestData> {
  const result: Partial<ParsedRequestData> = {};

  if (request.isMultipart()) {
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "screenshot") {
        result.screenshotBuffer = await part.toBuffer();
        result.screenshotMime = part.mimetype;
      } else if (part.type === "field") {
        const val = part.value as string;
        switch (part.fieldname) {
          case "installationId":
            result.installationId = Number(val);
            break;
          case "owner":
            result.owner = val;
            break;
          case "repo":
            result.repo = val;
            break;
          case "title":
            result.title = val;
            break;
          case "body":
            result.body = val;
            break;
          case "labels":
            try {
              result.labels = JSON.parse(val);
            } catch {
              result.labels = val.split(",").map((l) => l.trim());
            }
            break;
        }
      }
    }
  } else {
    Object.assign(result, request.body as SubmitBody);
  }

  // Validation
  if (
    !result.installationId ||
    !result.owner ||
    !result.repo ||
    !result.title ||
    !result.body
  ) {
    throw new Error(
      "Missing required fields (installationId, owner, repo, title, or body)"
    );
  }

  return result as ParsedRequestData;
}

/**
 * Fetches and parses the wafir.yaml config from the repo.
 */
async function getWafirConfig(
  octokit: any,
  owner: string,
  repo: string,
  log: any
): Promise<WafirConfig> {
  try {
    const { data: configData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".github/wafir.yaml",
    });

    if ("content" in configData) {
      const yamlContent = Buffer.from(configData.content, "base64").toString(
        "utf-8"
      );
      const config = (yaml.load(yamlContent) as WafirConfig) || {};
      log.info({ config }, "Loaded wafir.yaml config");
      return config;
    }
  } catch (error: any) {
    if (error.status === 404) {
      log.info("No wafir.yaml found, using defaults");
    } else {
      log.error({ error: error.message }, "Failed to fetch wafir.yaml");
    }
  }
  return {};
}

/**
 * Uploads screenshot to S3 and returns the markdown formatted image string.
 */
async function uploadScreenshot(
  s3Client: S3Client,
  bucketName: string | undefined,
  buffer: Buffer,
  mime: string,
  region: string | undefined
): Promise<string> {
  if (!bucketName) return "";

  const fileKey = `snapshots/${uuidv4()}.png`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: mime,
      ACL: "public-read",
    })
  );

  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  return `\n\n![Screenshot](${publicUrl})`;
}

/**
 * Finds the ProjectV2 Node ID. Handles complexity of checking Org vs User
 * and falling back to a User Token if necessary.
 */
async function findProjectNodeId(
  appOctokit: any,
  userOctokit: any | null,
  owner: string,
  number: number,
  log: any
): Promise<{
  nodeId: string | undefined;
  shouldUseUserToken: boolean;
  error?: string;
}> {
  // Try with App Token (Org or User)
  try {
    const result = await appOctokit.graphql(FIND_PROJECT_QUERY, {
      owner,
      number,
    });
    if (result.organization?.projectV2?.id)
      return {
        nodeId: result.organization.projectV2.id,
        shouldUseUserToken: false,
      };
    if (result.user?.projectV2?.id)
      return { nodeId: result.user.projectV2.id, shouldUseUserToken: true }; // User projects usually need user token for mutations
  } catch (error: any) {
    log.debug(
      { error: error.message },
      "App token project lookup failed, trying user token..."
    );
  }

  // Retry with User Token (specifically for User Projects)
  if (userOctokit) {
    try {
      const userResult = await userOctokit.graphql(
        `query FindUserProject($owner: String!, $number: Int!) {
          user(login: $owner) { projectV2(number: $number) { id } }
        }`,
        { owner, number }
      );
      if (userResult.user?.projectV2?.id) {
        log.info("Found project using User Token");
        return {
          nodeId: userResult.user.projectV2.id,
          shouldUseUserToken: true,
        };
      }
    } catch (error: any) {
      log.error({ error: error.message }, "User token project lookup failed");
    }
  }

  return {
    nodeId: undefined,
    shouldUseUserToken: false,
    error: `Could not find project #${number} for owner ${owner}. Ensure permissions are correct.`,
  };
}

/**
 * Adds an item (Draft or Existing Issue) to a Project V2.
 */
async function handleProjectLogic(params: {
  appOctokit: any;
  userOctokit: any | null;
  projectOwner: string;
  projectNumber: number;
  title: string;
  body: string;
  issueNodeId?: string; // If present, adds existing issue. If null, creates draft.
  log: any;
}): Promise<{ added: boolean; error?: string; itemId?: string }> {
  const {
    appOctokit,
    userOctokit,
    projectOwner,
    projectNumber,
    issueNodeId,
    title,
    body,
    log,
  } = params;

  const {
    nodeId: projectId,
    shouldUseUserToken,
    error: lookupError,
  } = await findProjectNodeId(
    appOctokit,
    userOctokit,
    projectOwner,
    projectNumber,
    log
  );

  if (!projectId) return { added: false, error: lookupError };

  const client = shouldUseUserToken && userOctokit ? userOctokit : appOctokit;

  try {
    if (issueNodeId) {
      // Add existing issue
      await client.graphql(ADD_TO_PROJECT_MUTATION, {
        projectId,
        contentId: issueNodeId,
      });
      return { added: true };
    } else {
      // Create draft
      const result: any = await client.graphql(ADD_DRAFT_TO_PROJECT_MUTATION, {
        projectId,
        title,
        body,
      });
      return {
        added: true,
        itemId: result.addProjectV2DraftIssue.projectItem.id,
      };
    }
  } catch (e: any) {
    return { added: false, error: e.message };
  }
}

// --- Main Route Handler ---

const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  fastify.post(
    "/submit",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Submit Feedback/Issue",
        description:
          "Creates a new issue or project draft. Supports multipart/form-data.",
      },
    },
    async (request, reply) => {
      try {
        // Parse Input
        const input = await parseSubmitRequest(request);
        const { installationId, owner, repo, title, labels } = input;
        let finalBody = input.body;

        // Initialize Clients
        const appOctokit = await fastify.getGitHubClient(installationId);
        const userToken = await fastify.tokenStore.getUserToken(installationId);
        const userOctokit = userToken
          ? fastify.getGitHubClientWithToken(userToken)
          : null;

        // Load Config
        const config = await getWafirConfig(
          appOctokit,
          owner,
          repo,
          request.log
        );
        const storageType = config.storage?.type || "issue";
        const projectNumber = config.storage?.projectNumber;
        const projectOwner = config.storage?.owner || owner;

        // Handle S3 Upload
        if (input.screenshotBuffer && input.screenshotMime) {
          try {
            const imageMd = await uploadScreenshot(
              s3Client,
              bucketName,
              input.screenshotBuffer,
              input.screenshotMime,
              process.env.AWS_REGION
            );
            finalBody += imageMd;
          } catch (e) {
            request.log.warn(
              "Failed to upload screenshot, continuing without it."
            );
          }
        }

        // Execute Storage Logic
        let issueData = {
          number: undefined as number | undefined,
          url: undefined as string | undefined,
          nodeId: undefined as string | undefined,
        };
        let projectResult: {
          added: boolean;
          error?: string;
        } = {
          added: false,
          error: undefined as string | undefined,
        };

        // Create Issue (if type is issue or both)
        if (storageType === "issue" || storageType === "both") {
          request.log.info("Creating GitHub issue...");
          const issue = await appOctokit.rest.issues.create({
            owner,
            repo,
            title,
            body: finalBody,
            labels: labels || ["wafir-feedback"],
          });
          issueData = {
            number: issue.data.number,
            url: issue.data.html_url,
            nodeId: issue.data.node_id,
          };
        }

        // Handle Project (Draft or Add Issue)
        if (
          projectNumber &&
          (storageType === "project" || storageType === "both")
        ) {
          // If "project" -> Create Draft (pass null nodeId).
          // If "both" -> Add existing issue (pass issueData.nodeId).
          const targetNodeId =
            storageType === "both" ? issueData.nodeId : undefined;

          projectResult = await handleProjectLogic({
            appOctokit,
            userOctokit,
            projectOwner,
            projectNumber,
            title,
            body: finalBody,
            issueNodeId: targetNodeId,
            log: request.log,
          });

          if (projectResult.error) {
            request.log.warn(
              { error: projectResult.error },
              "Project operation failed"
            );
          }
        } else if (storageType === "project" && !projectNumber) {
          projectResult.error =
            "Project storage requested but no projectNumber configured";
        }

        // Send Response
        const response = {
          success: true,
          issueUrl: issueData.url,
          issueNumber: issueData.number,
          projectAdded: projectResult.added,
          warning: projectResult.error,
        };

        return reply.code(201).send(response);
      } catch (error: any) {
        request.log.error(
          { error: error.message, stack: error.stack },
          "Submit failed"
        );

        // Handle Validation Error specially
        if (error.message.includes("Missing required fields")) {
          return reply.code(400).send({ error: error.message });
        }

        return reply
          .code(500)
          .send({ error: "Submission Failed", message: error.message });
      }
    }
  );
};

export default submitRoute;
