// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { S3Client } from "@aws-sdk/client-s3";
import { validateSubmission } from "../../shared/utils/config-validator.js";
import { SubmitService } from "./service.js";
import {
  GithubIssueSubmission,
  GithubSubmissionContext,
} from "./github-issue-submission.js";
import { RequestParserService } from "./request-parser.js";

const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  const submitService = new SubmitService();
  const githubSubmission = new GithubIssueSubmission();
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

        // Get GitHub installation ID from authRef
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

        // Append current date if enabled on the tab
        if (tab?.currentDate) {
          finalBody = submitService.appendCurrentDate(finalBody, true);
        }

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

        // Use the GithubIssueSubmission class to handle submission
        const submissionResult = await githubSubmission.submit({
          title,
          body: finalBody,
          labels,
          rating: input.rating,
          submissionType: input.submissionType,
          log: request.log,
          owner,
          repo,
          appOctokit,
          userOctokit,
          projectOwner,
          projectNumber,
          storageType,
          feedbackProjectNumber,
          feedbackProjectOwner,
          ratingFieldName,
          currentDate: tab?.currentDate,
        } as GithubSubmissionContext);

        if (!submissionResult.success) {
          return reply.code(500).send({
            error: "Submission Failed",
            message: submissionResult.error,
          });
        }

        return reply.code(201).send({
          success: true,
          issueUrl: submissionResult.url,
          issueNumber: submissionResult.number,
          projectAdded: submissionResult.projectAdded || false,
          warning: submissionResult.warning,
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
