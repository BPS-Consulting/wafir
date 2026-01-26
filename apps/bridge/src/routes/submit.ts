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
  rating?: number;
  submissionType?: "issue" | "feedback";
}

interface ParsedRequestData extends SubmitBody {
  screenshotBuffer?: Buffer;
  screenshotMime?: string;
  rating?: number;
  submissionType?: "issue" | "feedback";
}

interface WafirConfig {
  mode?: "issue" | "feedback" | "both";
  storage?: {
    type?: "issue" | "project" | "both";
    projectNumber?: number;
    owner?: string;
    repo?: string;
  };
  feedbackProject?: {
    projectNumber?: number;
    owner?: string;
    ratingField?: string;
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

const FIND_ORG_PROJECT_QUERY = `
  query FindOrgProject($owner: String!, $number: Int!) {
    organization(login: $owner) { projectV2(number: $number) { id } }
  }
`;

const FIND_USER_PROJECT_QUERY = `
  query FindUserProject($owner: String!, $number: Int!) {
    user(login: $owner) { projectV2(number: $number) { id } }
  }
`;

const FIND_PROJECT_FIELDS_QUERY = `
  query FindProjectFields($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 50) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_PROJECT_FIELD_MUTATION = `
  mutation UpdateProjectField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item { id }
    }
  }
`;

/**
 * Parses the incoming request, handling both Multipart (with screenshot) and JSON (text only) bodies.
 */
async function parseSubmitRequest(
  request: FastifyRequest,
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
          case "rating":
            result.rating = Number(val);
            break;
          case "submissionType":
            result.submissionType = val as "issue" | "feedback";
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
    result.body === undefined ||
    result.body === null
  ) {
    throw new Error(
      "Missing required fields (installationId, owner, repo, title, or body)",
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
  log: any,
): Promise<WafirConfig> {
  try {
    const { data: configData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".github/wafir.yaml",
    });

    if ("content" in configData) {
      const yamlContent = Buffer.from(configData.content, "base64").toString(
        "utf-8",
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
  region: string | undefined,
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
    }),
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
  log: any,
): Promise<{
  nodeId: string | undefined;
  shouldUseUserToken: boolean;
  error?: string;
}> {
  // Try with App Token - Organization first
  log.info({ owner, number }, "Looking up project with App token...");
  try {
    const result = await appOctokit.graphql(FIND_ORG_PROJECT_QUERY, {
      owner,
      number,
    });
    log.info({ result }, "GraphQL org project lookup result");
    if (result.organization?.projectV2?.id)
      return {
        nodeId: result.organization.projectV2.id,
        shouldUseUserToken: false,
      };
  } catch (error: any) {
    log.debug(
      { error: error.message, owner, number },
      "Org project lookup failed, trying user project...",
    );
  }

  // Try with App Token - User project
  try {
    const result = await appOctokit.graphql(FIND_USER_PROJECT_QUERY, {
      owner,
      number,
    });
    log.info({ result }, "GraphQL user project lookup result");
    if (result.user?.projectV2?.id)
      return { nodeId: result.user.projectV2.id, shouldUseUserToken: true }; // User projects usually need user token for mutations
  } catch (error: any) {
    log.debug(
      { error: error.message, owner, number },
      "App token user project lookup failed, trying with user token...",
    );
  }

  // Retry with User Token (specifically for User Projects)
  if (userOctokit) {
    try {
      const userResult = await userOctokit.graphql(
        `query FindUserProject($owner: String!, $number: Int!) {
          user(login: $owner) { projectV2(number: $number) { id } }
        }`,
        { owner, number },
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
    log,
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

/**
 * Sets the Rating field on a project item.
 * Maps numeric rating (1-5) to emoji star options (⭐, ⭐⭐, etc.)
 */
async function setProjectRatingField(params: {
  octokit: any;
  projectId: string;
  itemId: string;
  ratingFieldName: string;
  rating: number;
  log: any;
}): Promise<{ success: boolean; error?: string }> {
  const { octokit, projectId, itemId, ratingFieldName, rating, log } = params;

  try {
    const fieldsResult: any = await octokit.graphql(FIND_PROJECT_FIELDS_QUERY, {
      projectId,
    });

    const fields = fieldsResult.node?.fields?.nodes || [];
    const ratingField = fields.find(
      (f: any) => f?.name?.toLowerCase() === ratingFieldName.toLowerCase(),
    );

    if (!ratingField) {
      log.warn(`Rating field "${ratingFieldName}" not found in project`);
      return { success: false, error: `Field "${ratingFieldName}" not found` };
    }

    const starEmojis = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
    const targetEmoji = starEmojis[Math.min(Math.max(rating - 1, 0), 4)];

    const matchingOption = ratingField.options?.find(
      (opt: any) => opt.name === targetEmoji,
    );

    if (!matchingOption) {
      log.warn(`No matching option for rating ${rating} (${targetEmoji})`);
      return {
        success: false,
        error: `No option matching "${targetEmoji}" in Rating field`,
      };
    }

    await octokit.graphql(UPDATE_PROJECT_FIELD_MUTATION, {
      projectId,
      itemId,
      fieldId: ratingField.id,
      optionId: matchingOption.id,
    });

    log.info({ rating, itemId }, "Set Rating field on project item");
    return { success: true };
  } catch (e: any) {
    log.error({ error: e.message }, "Failed to set Rating field");
    return { success: false, error: e.message };
  }
}

// --- Main Route Handler ---

/**
 * Fastify route plugin for handling WAFIR feedback and issue submissions.
 *
 * This route processes POST requests to `/submit` and supports two types of submissions:
 * - **Issue submissions**: Creates GitHub issues and optionally adds them to projects
 * - **Feedback submissions**: Creates project drafts with optional ratings
 *
 * @remarks
 * The route handles:
 * - Multipart form data parsing including optional screenshot uploads
 * - S3 storage for screenshots (if provided)
 * - GitHub issue creation based on storage configuration
 * - GitHub project integration (adding issues or creating drafts)
 * - Rating field assignment for feedback submissions
 * - Flexible storage types: `issue`, `project`, or `both`
 *
 * Configuration is read from `.github/wafir.yml` in the target repository and supports:
 * - `storage.type`: Determines where issue submissions are stored
 * - `storage.projectNumber`: Project number for issue submissions
 * - `feedbackProject.projectNumber`: Separate project for feedback submissions
 * - `feedbackProject.ratingField`: Custom field name for rating (defaults to "Rating")
 *
 * @param fastify - Fastify instance with GitHub client extensions
 * @param opts - Plugin options
 * @returns Promise that resolves when the route is registered
 *
 * @throws {400} When required fields are missing in the request
 * @throws {500} When submission processing fails
 *
 * @example
 * Response format:
 * ```json
 * {
 *   "success": true,
 *   "issueUrl": "https://github.com/owner/repo/issues/123",
 *   "issueNumber": 123,
 *   "projectAdded": true,
 *   "warning": "Optional warning message"
 * }
 * ```
 */
const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts,
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
          request.log,
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
              process.env.AWS_REGION,
            );
            finalBody += imageMd;
          } catch (e) {
            request.log.warn(
              "Failed to upload screenshot, continuing without it.",
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

        // Create Issue (if type is issue or both AND this is an issue submission)
        const isFeedbackSubmission = input.submissionType === "feedback";
        const shouldCreateIssue =
          !isFeedbackSubmission &&
          (storageType === "issue" || storageType === "both");

        if (shouldCreateIssue) {
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
          request.log.info(
            { issueNumber: issueData.number, issueUrl: issueData.url },
            "GitHub issue created successfully",
          );
        }

        // Handle Project (Draft or Add Issue)
        // For feedback submissions, use feedbackProject config if available, otherwise use storage
        const feedbackProjectNumber =
          config.feedbackProject?.projectNumber || projectNumber;
        const feedbackProjectOwner =
          config.feedbackProject?.owner || projectOwner;
        const ratingFieldName = config.feedbackProject?.ratingField || "Rating";

        const shouldAddToProject =
          projectNumber &&
          !isFeedbackSubmission &&
          (storageType === "project" || storageType === "both");

        const shouldCreateFeedbackDraft =
          isFeedbackSubmission && feedbackProjectNumber;

        if (shouldAddToProject) {
          // Regular issue/project handling
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
              "Project operation failed",
            );
          } else {
            request.log.info(
              { projectNumber, projectOwner },
              "Successfully added to project",
            );
          }
        } else if (shouldCreateFeedbackDraft) {
          // Feedback submission - create draft and set Rating
          request.log.info("Creating feedback draft in project...");

          const {
            nodeId: feedbackProjId,
            shouldUseUserToken,
            error: projLookupError,
          } = await findProjectNodeId(
            appOctokit,
            userOctokit,
            feedbackProjectOwner,
            feedbackProjectNumber,
            request.log,
          );

          if (!feedbackProjId) {
            projectResult.error =
              projLookupError || "Could not find feedback project";
          } else {
            const client =
              shouldUseUserToken && userOctokit ? userOctokit : appOctokit;

            projectResult = await handleProjectLogic({
              appOctokit,
              userOctokit,
              projectOwner: feedbackProjectOwner,
              projectNumber: feedbackProjectNumber,
              title,
              body: finalBody,
              issueNodeId: undefined,
              log: request.log,
            });

            if (
              projectResult.added &&
              (projectResult as any).itemId &&
              input.rating
            ) {
              request.log.info(
                {
                  itemId: (projectResult as any).itemId,
                  feedbackProjectNumber,
                },
                "Feedback draft created in project",
              );
              await setProjectRatingField({
                octokit: client,
                projectId: feedbackProjId,
                itemId: (projectResult as any).itemId,
                ratingFieldName,
                rating: input.rating,
                log: request.log,
              });
            } else if (projectResult.added) {
              request.log.info(
                { feedbackProjectNumber },
                "Feedback draft created in project (no rating)",
              );
            }
          }
        } else if (storageType === "project" && !projectNumber) {
          projectResult.error =
            "Project storage requested but no projectNumber configured";
        } else if (isFeedbackSubmission && !feedbackProjectNumber) {
          request.log.info(
            "No feedback project configured, creating issue instead...",
          );

          let issueBody = finalBody;
          if (input.rating) {
            const stars = "⭐".repeat(input.rating);
            issueBody = `**Rating:** ${stars} (${input.rating}/5)\n\n${issueBody}`;
          }

          const issue = await appOctokit.rest.issues.create({
            owner,
            repo,
            title,
            body: issueBody,
            labels: labels || ["feedback"],
          });
          issueData = {
            number: issue.data.number,
            url: issue.data.html_url,
            nodeId: issue.data.node_id,
          };
          request.log.info(
            { issueNumber: issueData.number, issueUrl: issueData.url },
            "Feedback issue created (no project configured)",
          );
        }

        // Send Response
        const response = {
          success: true,
          issueUrl: issueData.url,
          issueNumber: issueData.number,
          projectAdded: projectResult.added,
          warning: projectResult.error,
        };

        request.log.info(
          { response, submissionType: input.submissionType },
          "Submission completed successfully",
        );

        return reply.code(201).send(response);
      } catch (error: any) {
        request.log.error(
          { error: error.message, stack: error.stack },
          "Submit failed",
        );

        // Handle Validation Error specially
        if (error.message.includes("Missing required fields")) {
          return reply.code(400).send({ error: error.message });
        }

        return reply
          .code(500)
          .send({ error: "Submission Failed", message: error.message });
      }
    },
  );
};

export default submitRoute;
