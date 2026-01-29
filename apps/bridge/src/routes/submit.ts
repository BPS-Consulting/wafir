import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import yaml from "js-yaml";

interface SubmitBody {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  labels?: string[];
  rating?: number;
  submissionType?: "issue" | "feedback";
  formFields?: Record<string, unknown>;
  fieldOrder?: string[];
  browserInfo?: {
    url?: string;
    userAgent?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    language?: string;
  };
  consoleLogs?: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

interface ParsedRequestData extends SubmitBody {
  screenshotBuffer?: Buffer;
  screenshotMime?: string;
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

// Keys to exclude from the markdown body (used for other purposes)
const EXCLUDED_FORM_KEYS = new Set(["title"]);

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
 * Converts a numeric rating (1-5) to star emojis.
 */
function ratingToStars(rating: number): string {
  const clampedRating = Math.min(Math.max(Math.round(rating), 1), 5);
  return "⭐".repeat(clampedRating);
}

/**
 * Formats a field label to be human-readable (capitalize, replace underscores).
 */
function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Builds a markdown body from form fields.
 * Format: **Label**\nValue\n\n for each field.
 * - Excludes keys in EXCLUDED_FORM_KEYS
 * - Converts rating to star emojis
 * - Preserves field order if fieldOrder is provided
 */
function buildMarkdownFromFields(
  formFields: Record<string, unknown>,
  fieldOrder?: string[],
): string {
  const orderedKeys = fieldOrder?.length
    ? fieldOrder.filter((key) => key in formFields)
    : Object.keys(formFields);

  const lines: string[] = [];

  for (const key of orderedKeys) {
    if (EXCLUDED_FORM_KEYS.has(key)) continue;

    const value = formFields[key];
    if (value === undefined || value === null || value === "") continue;

    const label = formatFieldLabel(key);
    let displayValue: string;

    if (key === "rating" && typeof value === "number") {
      displayValue = ratingToStars(value);
    } else if (Array.isArray(value)) {
      displayValue = value.join(", ");
    } else {
      displayValue = String(value);
    }

    lines.push(`**${label}**\n${displayValue}`);
  }

  return lines.join("\n\n");
}

/**
 * Appends browser info as markdown if provided.
 */
function appendBrowserInfo(
  body: string,
  browserInfo?: SubmitBody["browserInfo"],
): string {
  if (!browserInfo) return body;

  const infoLines: string[] = [];
  if (browserInfo.url) infoLines.push(`| URL | ${browserInfo.url} |`);
  if (browserInfo.userAgent)
    infoLines.push(`| User Agent | \`${browserInfo.userAgent}\` |`);
  if (browserInfo.viewportWidth && browserInfo.viewportHeight)
    infoLines.push(
      `| Viewport | ${browserInfo.viewportWidth}x${browserInfo.viewportHeight} |`,
    );
  if (browserInfo.language)
    infoLines.push(`| Language | ${browserInfo.language} |`);

  if (infoLines.length === 0) return body;

  const browserSection = `\n\n---\n\n**Browser Info**\n| Field | Value |\n| :--- | :--- |\n${infoLines.join("\n")}`;
  return body + browserSection;
}

/**
 * Appends console logs as markdown if provided.
 */
function appendConsoleLogs(
  body: string,
  consoleLogs?: SubmitBody["consoleLogs"],
): string {
  if (!consoleLogs || consoleLogs.length === 0) return body;

  const logsText = consoleLogs
    .map((log) => `[${log.type.toUpperCase()}] ${log.message}`)
    .join("\n");

  return body + `\n\n---\n\n**Console Logs**\n\`\`\`\n${logsText}\n\`\`\``;
}

/**
 * Parses the incoming request, handling both Multipart (with screenshot) and JSON bodies.
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
          case "formFields":
            try {
              result.formFields = JSON.parse(val);
            } catch {
              result.formFields = {};
            }
            break;
          case "fieldOrder":
            try {
              result.fieldOrder = JSON.parse(val);
            } catch {
              result.fieldOrder = [];
            }
            break;
          case "browserInfo":
            try {
              result.browserInfo = JSON.parse(val);
            } catch {
              result.browserInfo = undefined;
            }
            break;
          case "consoleLogs":
            try {
              result.consoleLogs = JSON.parse(val);
            } catch {
              result.consoleLogs = [];
            }
            break;
        }
      }
    }
  } else {
    Object.assign(result, request.body as SubmitBody);
  }

  // Validation
  if (!result.installationId || !result.owner || !result.repo) {
    throw new Error("Missing required fields (installationId, owner, or repo)");
  }

  // Get title from formFields if not provided directly
  if (!result.title && result.formFields?.title) {
    result.title = String(result.formFields.title);
  }

  if (!result.title) {
    throw new Error("Missing required field: title");
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
 * Finds the ProjectV2 Node ID.
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
  try {
    const result = await appOctokit.graphql(FIND_ORG_PROJECT_QUERY, {
      owner,
      number,
    });
    if (result.organization?.projectV2?.id) {
      return {
        nodeId: result.organization.projectV2.id,
        shouldUseUserToken: false,
      };
    }
  } catch (error: any) {
    log.debug({ error: error.message }, "Org project lookup failed");
  }

  // Try with App Token - User project
  try {
    const result = await appOctokit.graphql(FIND_USER_PROJECT_QUERY, {
      owner,
      number,
    });
    if (result.user?.projectV2?.id) {
      return { nodeId: result.user.projectV2.id, shouldUseUserToken: true };
    }
  } catch (error: any) {
    log.debug({ error: error.message }, "User project lookup failed");
  }

  // Retry with User Token
  if (userOctokit) {
    try {
      const result = await userOctokit.graphql(FIND_USER_PROJECT_QUERY, {
        owner,
        number,
      });
      if (result.user?.projectV2?.id) {
        return { nodeId: result.user.projectV2.id, shouldUseUserToken: true };
      }
    } catch (error: any) {
      log.error({ error: error.message }, "User token project lookup failed");
    }
  }

  return {
    nodeId: undefined,
    shouldUseUserToken: false,
    error: `Could not find project #${number} for owner ${owner}`,
  };
}

/**
 * Adds an item (Draft or Existing Issue) to a Project V2.
 */
async function addToProject(params: {
  appOctokit: any;
  userOctokit: any | null;
  projectOwner: string;
  projectNumber: number;
  title: string;
  body: string;
  issueNodeId?: string;
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
      await client.graphql(ADD_TO_PROJECT_MUTATION, {
        projectId,
        contentId: issueNodeId,
      });
      return { added: true };
    } else {
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
      return { success: false, error: `Field "${ratingFieldName}" not found` };
    }

    const starEmojis = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
    const targetEmoji = starEmojis[Math.min(Math.max(rating - 1, 0), 4)];

    const matchingOption = ratingField.options?.find(
      (opt: any) => opt.name === targetEmoji,
    );

    if (!matchingOption) {
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
          "Creates a GitHub issue or project draft from form fields. Supports multipart/form-data.",
      },
    },
    async (request, reply) => {
      try {
        // Parse Input
        const input = await parseSubmitRequest(request);
        const { installationId, owner, repo, title, labels } = input;

        // Build markdown body from form fields
        let finalBody = buildMarkdownFromFields(
          input.formFields || {},
          input.fieldOrder,
        );

        // Append browser info if provided
        finalBody = appendBrowserInfo(finalBody, input.browserInfo);

        // Append console logs if provided
        finalBody = appendConsoleLogs(finalBody, input.consoleLogs);

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

        // Handle Screenshot Upload
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
              "Failed to upload screenshot, continuing without it",
            );
          }
        }

        // Determine submission targets
        const isFeedback = input.submissionType === "feedback";
        const feedbackProjectNumber =
          config.feedbackProject?.projectNumber || projectNumber;
        const feedbackProjectOwner =
          config.feedbackProject?.owner || projectOwner;
        const ratingFieldName = config.feedbackProject?.ratingField || "Rating";

        let issueData: {
          number?: number;
          url?: string;
          nodeId?: string;
        } = {};
        let projectResult: { added: boolean; error?: string; itemId?: string } =
          {
            added: false,
          };

        // Create GitHub Issue (for non-feedback or when no project is configured)
        const shouldCreateIssue =
          !isFeedback && (storageType === "issue" || storageType === "both");

        if (shouldCreateIssue) {
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
          request.log.info({ issueNumber: issueData.number }, "Issue created");
        }

        // Add to project (if configured)
        const shouldAddToProject =
          projectNumber &&
          !isFeedback &&
          (storageType === "project" || storageType === "both");

        if (shouldAddToProject) {
          const targetNodeId =
            storageType === "both" ? issueData.nodeId : undefined;

          projectResult = await addToProject({
            appOctokit,
            userOctokit,
            projectOwner,
            projectNumber,
            title,
            body: finalBody,
            issueNodeId: targetNodeId,
            log: request.log,
          });
        }

        // Handle feedback submissions (project draft with rating)
        if (isFeedback && feedbackProjectNumber) {
          const { nodeId: feedbackProjId, shouldUseUserToken } =
            await findProjectNodeId(
              appOctokit,
              userOctokit,
              feedbackProjectOwner,
              feedbackProjectNumber,
              request.log,
            );

          if (feedbackProjId) {
            projectResult = await addToProject({
              appOctokit,
              userOctokit,
              projectOwner: feedbackProjectOwner,
              projectNumber: feedbackProjectNumber,
              title,
              body: finalBody,
              log: request.log,
            });

            // Set rating field if provided
            if (projectResult.added && projectResult.itemId && input.rating) {
              const client =
                shouldUseUserToken && userOctokit ? userOctokit : appOctokit;
              await setProjectRatingField({
                octokit: client,
                projectId: feedbackProjId,
                itemId: projectResult.itemId,
                ratingFieldName,
                rating: input.rating,
                log: request.log,
              });
            }
          } else {
            projectResult.error = "Could not find feedback project";
          }
        }

        // Fallback: create issue for feedback if no project configured
        if (isFeedback && !feedbackProjectNumber) {
          const issue = await appOctokit.rest.issues.create({
            owner,
            repo,
            title,
            body: finalBody,
            labels: labels || ["feedback"],
          });
          issueData = {
            number: issue.data.number,
            url: issue.data.html_url,
            nodeId: issue.data.node_id,
          };
          request.log.info(
            { issueNumber: issueData.number },
            "Feedback issue created (no project configured)",
          );
        }

        return reply.code(201).send({
          success: true,
          issueUrl: issueData.url,
          issueNumber: issueData.number,
          projectAdded: projectResult.added,
          warning: projectResult.error,
        });
      } catch (error: any) {
        request.log.error({ error: error.message }, "Submit failed");

        if (error.message.includes("Missing required")) {
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
