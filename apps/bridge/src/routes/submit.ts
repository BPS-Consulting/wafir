import { FastifyPluginAsync } from "fastify";
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

const FIND_PROJECT_QUERY = `
  query FindProject($owner: String!, $number: Int!) {
    organization(login: $owner) {
      projectV2(number: $number) {
        id
      }
    }
    user(login: $owner) {
      projectV2(number: $number) {
        id
      }
    }
  }
`;

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
          "Creates a new issue in the target GitHub repository. Supports multipart/form-data for screenshots, which are uploaded to SnapStore (S3).",
      },
    },
    async (request, reply) => {
      let installationId: number | undefined;
      let owner: string | undefined;
      let repo: string | undefined;
      let title: string | undefined;
      let body: string | undefined;
      let labels: string[] | undefined;
      let screenshotBuffer: Buffer | undefined;
      let screenshotMime: string | undefined;

      if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === "file") {
            if (part.fieldname === "screenshot") {
              screenshotBuffer = await part.toBuffer();
              screenshotMime = part.mimetype;
            }
          } else {
            switch (part.fieldname) {
              case "installationId":
                installationId = Number(part.value);
                break;
              case "owner":
                owner = String(part.value);
                break;
              case "repo":
                repo = String(part.value);
                break;
              case "title":
                title = String(part.value);
                break;
              case "body":
                body = String(part.value);
                break;
              case "labels":
                try {
                  labels = JSON.parse(String(part.value));
                } catch {
                  labels = String(part.value)
                    .split(",")
                    .map((l) => l.trim());
                }
                break;
            }
          }
        }
      } else {
        const data = request.body as SubmitBody;
        installationId = data.installationId;
        owner = data.owner;
        repo = data.repo;
        title = data.title;
        body = data.body;
        labels = data.labels;
      }

      if (!installationId || !owner || !repo || !title || !body) {
        return reply.code(400).send({ error: "Missing required fields" });
      }

      try {
        const octokit = await fastify.getGitHubClient(installationId);

        // Fetch wafir.yaml config to get storage settings
        let wafirConfig: WafirConfig = {};
        try {
          const { data: configData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: ".github/wafir.yaml",
          });

          if ("content" in configData) {
            const yamlContent = Buffer.from(
              configData.content,
              "base64"
            ).toString("utf-8");
            wafirConfig = (yaml.load(yamlContent) as WafirConfig) || {};
            request.log.info({ wafirConfig }, "Loaded wafir.yaml config");
          }
        } catch (configError: any) {
          if (configError.status === 404) {
            request.log.info("No wafir.yaml found, using defaults");
          } else {
            request.log.error(
              { error: configError.message, status: configError.status },
              "Failed to fetch wafir.yaml"
            );
          }
        }

        const storageType = wafirConfig.storage?.type || "issue";
        const projectNumber = wafirConfig.storage?.projectNumber;
        const projectOwner = wafirConfig.storage?.owner || owner;

        request.log.info(
          { storageType, projectNumber, projectOwner },
          "Storage settings"
        );

        let finalBody = body;

        // Upload to S3 if screenshot exists
        if (screenshotBuffer && screenshotMime && bucketName) {
          const fileKey = `snapshots/${uuidv4()}.png`;
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
              Body: screenshotBuffer,
              ContentType: screenshotMime,
              ACL: "public-read",
            })
          );

          const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
          finalBody += `\n\n![Screenshot](${publicUrl})`;
        } else if (screenshotBuffer && !bucketName) {
          request.log.warn(
            "S3_BUCKET_NAME not set, skipping screenshot upload"
          );
        }

        let issueNodeId: string | undefined;
        let issueUrl: string | undefined;
        let issueNumber: number | undefined;

        // Create issue if storage type is 'issue' or 'both'
        if (storageType === "issue" || storageType === "both") {
          request.log.info("Creating GitHub issue...");
          const issue = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body: finalBody,
            labels: labels || ["wafir-feedback"],
          });

          issueNodeId = issue.data.node_id;
          issueUrl = issue.data.html_url;
          issueNumber = issue.data.number;
          request.log.info(
            { issueNumber, issueUrl, issueNodeId },
            "Created issue"
          );
        }

        // Add to project if storage type is 'project' or 'both'
        let projectAdded = false;
        let projectError: string | undefined;

        if (
          (storageType === "project" || storageType === "both") &&
          projectNumber
        ) {
          request.log.info(
            { storageType, projectNumber },
            "Will add to project"
          );

          if (!issueNodeId && storageType === "project") {
            request.log.info(
              "Creating GitHub issue for project-only storage..."
            );
            const issue = await octokit.rest.issues.create({
              owner,
              repo,
              title,
              body: finalBody,
              labels: labels || ["wafir-feedback"],
            });

            issueNodeId = issue.data.node_id;
            issueUrl = issue.data.html_url;
            issueNumber = issue.data.number;
            request.log.info(
              { issueNumber, issueUrl, issueNodeId },
              "Created issue for project"
            );
          }

          if (issueNodeId) {
            try {
              request.log.info(
                { projectOwner, projectNumber, repo },
                "Looking up project node ID..."
              );

              let projectNodeId: string | undefined;

              // Find project via GraphQL (checks both org and user in one query)
              try {
                const projectResult = await octokit.graphql<{
                  organization: { projectV2: { id: string } | null } | null;
                  user: { projectV2: { id: string } | null } | null;
                }>(FIND_PROJECT_QUERY, {
                  owner: projectOwner,
                  number: projectNumber,
                });

                projectNodeId =
                  projectResult.organization?.projectV2?.id ||
                  projectResult.user?.projectV2?.id;

                request.log.info(
                  { projectResult, projectNodeId },
                  "GraphQL response for project lookup"
                );
              } catch (error: any) {
                request.log.error(
                  { error: error.message, errors: error.errors },
                  "Failed to find project via GraphQL"
                );

                // Check if this is a personal project access issue and try user token
                const isUserProjectError = error.errors?.some(
                  (e: { path?: string[]; type?: string }) =>
                    e.path?.includes("user") && e.type === "NOT_FOUND"
                );

                if (isUserProjectError) {
                  const userToken =
                    await fastify.tokenStore.getUserToken(installationId);
                  if (userToken) {
                    request.log.info(
                      "Retrying with user token for personal project..."
                    );
                    try {
                      const userOctokit =
                        fastify.getGitHubClientWithToken(userToken);
                      const userResult = await userOctokit.graphql<{
                        user: { projectV2: { id: string } | null } | null;
                      }>(
                        `query FindUserProject($owner: String!, $number: Int!) {
                          user(login: $owner) {
                            projectV2(number: $number) { id }
                          }
                        }`,
                        { owner: projectOwner, number: projectNumber }
                      );
                      projectNodeId = userResult.user?.projectV2?.id;
                      request.log.info(
                        { projectNodeId },
                        "Found project with user token"
                      );
                    } catch (userError: any) {
                      request.log.error(
                        { error: userError.message },
                        "User token project lookup also failed"
                      );
                    }
                  } else {
                    request.log.warn(
                      { installationId },
                      "Personal project access requires OAuth authorization. Visit /connect to authorize."
                    );
                  }
                }
              }

              if (projectNodeId) {
                request.log.info(
                  { projectNodeId, issueNodeId },
                  "Adding issue to project..."
                );
                try {
                  const addResult = await octokit.graphql(
                    ADD_TO_PROJECT_MUTATION,
                    {
                      projectId: projectNodeId,
                      contentId: issueNodeId,
                    }
                  );
                  request.log.info(
                    { addResult },
                    `Successfully added issue to project #${projectNumber}`
                  );
                  projectAdded = true;
                } catch (addError: any) {
                  request.log.error(
                    { error: addError.message },
                    "Failed to add issue to project"
                  );
                  projectError = `Failed to add to project: ${addError.message}`;
                }
              } else {
                projectError = `Could not find project #${projectNumber} for user ${projectOwner}. Personal projects require OAuth authorization.`;
                request.log.error(
                  { projectOwner, projectNumber, repo },
                  projectError
                );
              }
            } catch (projectLookupError: any) {
              projectError = `Project lookup failed: ${projectLookupError.message}`;
              request.log.error(
                {
                  error: projectLookupError.message,
                  errors: projectLookupError.errors,
                  data: projectLookupError.data,
                },
                "Failed to add to project"
              );
            }
          } else {
            request.log.warn("No issueNodeId available, cannot add to project");
            projectError = "No issue ID available to add to project";
          }
        } else if (storageType === "project" || storageType === "both") {
          projectError =
            "Project storage requested but no projectNumber configured";
          request.log.warn({ storageType, projectNumber }, projectError);
        }

        const response: {
          success: boolean;
          issueUrl?: string;
          issueNumber?: number;
          projectAdded?: boolean;
          warning?: string;
        } = {
          success: true,
          issueUrl,
          issueNumber,
        };

        if (storageType === "project" || storageType === "both") {
          response.projectAdded = projectAdded;
          if (!projectAdded && projectError) {
            response.warning = projectError;
          }
        }

        reply.code(201).send(response);
      } catch (error: any) {
        request.log.error(
          { error: error.message, stack: error.stack },
          "Submit failed"
        );
        return reply
          .code(500)
          .send({ error: "Submission Failed", message: error.message });
      }
    }
  );
};

export default submitRoute;
