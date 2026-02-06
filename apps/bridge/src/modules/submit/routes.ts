// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { S3Client } from "@aws-sdk/client-s3";
import { validateSubmission } from "../../shared/utils/config-validator.js";
import { SubmitService } from "./service.js";
import { GitHubProjectService } from "./github-project-service.js";
import { RequestParserService } from "./request-parser.js";

const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  const submitService = new SubmitService();
  const projectService = new GitHubProjectService();
  const parserService = new RequestParserService();

  fastify.post(
    "/",
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
        const input = await parserService.parseSubmitRequest(request);

        // Extract request origin for same-origin validation
        const referer = request.headers.referer || request.headers.origin;
        let requestOrigin: string | undefined;

        if (referer) {
          try {
            const refererUrl = new URL(referer);
            requestOrigin = refererUrl.origin;
          } catch (e) {
            request.log.warn(
              { referer },
              "Failed to parse referer for origin validation",
            );
          }
        }

        // Validate submission against authoritative config
        const validationResult = await validateSubmission({
          configUrl: input.configUrl,
          installationId: input.installationId,
          targetType: input.targetType,
          target: input.target,
          authRef: input.authRef,
          formFields: input.formFields || {},
          tabId: input.tabId,
          requestOrigin,
        });

        if (!validationResult.valid) {
          request.log.warn(
            { errors: validationResult.errors },
            "Submission validation failed",
          );
          return reply.code(400).send({
            error: "Validation Failed",
            details: validationResult.errors,
          });
        }

        // Use ONLY values from the validated config, not from client submission
        const config = validationResult.config!;

        // Determine which targets to use for this submission
        // 1. If a tab is specified and it has targets, use those
        // 2. Otherwise, use all targets from config
        const tab = config.tabs?.find((t) => t.id === input.tabId);
        const targetIds =
          tab?.targets && tab.targets.length > 0
            ? tab.targets
            : config.targets.map((t) => t.id);

        // Get the actual target configurations
        const submissionTargets = config.targets.filter((t) =>
          targetIds.includes(t.id),
        );

        if (submissionTargets.length === 0) {
          return reply.code(400).send({
            error: "No valid targets configured for this submission",
          });
        }

        // For backward compatibility, extract owner/repo from the first github/issues or github/project target
        const githubTarget = submissionTargets.find(
          (t) => t.type === "github/issues" || t.type === "github/project",
        );

        if (!githubTarget) {
          return reply.code(400).send({
            error: "No GitHub target configured",
          });
        }

        // Use installationId from githubTarget.authRef
        const installationId = Number(githubTarget.authRef);

        // Parse owner/repo from target string (format: "owner/repo" or "owner/projectNum")
        const [owner, repoOrProject] = githubTarget.target.split("/");
        const repo = repoOrProject; // For now, assume it's a repo; we'll check type below

        // Determine submission behavior based on target types
        const hasIssueTarget = submissionTargets.some(
          (t) => t.type === "github/issues",
        );
        const hasProjectTarget = submissionTargets.some(
          (t) => t.type === "github/project",
        );
        const storageType =
          hasIssueTarget && hasProjectTarget
            ? "both"
            : hasIssueTarget
              ? "issue"
              : "project";

        // Extract project number if there's a project target
        let projectNumber: number | undefined;
        let projectOwner = owner;
        const projectTarget = submissionTargets.find(
          (t) => t.type === "github/project",
        );
        if (projectTarget) {
          const [projOwner, projNum] = projectTarget.target.split("/");
          projectOwner = projOwner;
          projectNumber = parseInt(projNum, 10);
        }

        // Feedback project settings from config
        const feedbackProjectNumber =
          config.feedbackProject?.projectNumber || projectNumber;
        const feedbackProjectOwner =
          config.feedbackProject?.owner || projectOwner;
        const ratingFieldName = config.feedbackProject?.ratingField || "Rating";

        // Title and labels can come from form (validated above)
        const title = input.title;
        const labels = input.labels;

        // Build markdown body from validated form fields
        let finalBody = submitService.buildMarkdownFromFields(
          input.formFields || {},
          input.fieldOrder,
        );

        // Append browser info if provided
        finalBody = submitService.appendBrowserInfo(
          finalBody,
          input.browserInfo,
        );

        // Append console logs if provided
        finalBody = submitService.appendConsoleLogs(
          finalBody,
          input.consoleLogs,
        );

        // Initialize Clients using config values
        const appOctokit = await fastify.getGitHubClient(installationId);
        const userToken = await fastify.tokenStore.getUserToken(installationId);
        const userOctokit = userToken
          ? fastify.getGitHubClientWithToken(userToken)
          : null;

        // Handle Screenshot Upload
        if (input.screenshotBuffer && input.screenshotMime) {
          try {
            const imageMd = await submitService.uploadScreenshot(
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
          projectNumber !== undefined &&
          !isFeedback &&
          (storageType === "project" || storageType === "both");

        if (shouldAddToProject && projectNumber !== undefined) {
          const targetNodeId =
            storageType === "both" ? issueData.nodeId : undefined;

          projectResult = await projectService.addToProject({
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
            await projectService.findProjectNodeId(
              appOctokit,
              userOctokit,
              feedbackProjectOwner,
              feedbackProjectNumber,
              request.log,
            );

          if (feedbackProjId) {
            projectResult = await projectService.addToProject({
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
              await projectService.setProjectRatingField({
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
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        request.log.error({ error: message }, "Submit failed");

        if (message.includes("Missing required")) {
          return reply.code(400).send({ error: message });
        }

        return reply.code(500).send({ error: "Submission Failed", message });
      }
    },
  );
};

export default submitRoute;
