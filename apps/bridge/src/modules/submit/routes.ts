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
import { GitHubProjectService } from "./github-project-service.js";

const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  const submitService = new SubmitService();
  const githubSubmission = new GithubIssueSubmission();
  const parserService = new RequestParserService();
  const projectService = new GitHubProjectService();

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
          formId: input.formId,
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
        // 1. If a form is specified and it has targets, use those
        // 2. Otherwise, use all targets from config
        const form = config.forms?.find((f) => f.id === input.formId);
        const targetIds =
          form?.targets && form.targets.length > 0
            ? form.targets
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

        // Title and labels can come from form (validated above)
        const title = input.title;
        
        // Merge labels: form config labels take priority, then input labels
        const formLabels = form?.labels || [];
        const inputLabels = input.labels || [];
        const labels = [...new Set([...formLabels, ...inputLabels])];
        
        // Use form id as the issue type
        const issueType = form?.id;

        // Initialize Clients using config values
        const appOctokit = await fastify.getGitHubClient(installationId);
        const userToken = await fastify.tokenStore.getUserToken(installationId);
        const userOctokit = userToken
          ? fastify.getGitHubClientWithToken(userToken)
          : null;

        // Determine which fields will be written to project (to exclude from issue body)
        let excludeFieldsFromBody = new Set<string>();
        let projectNodeId: string | undefined;
        let projectUseUserToken = false;

        if (hasProjectTarget && projectNumber !== undefined && input.formFields) {
          try {
            const { nodeId: projId, shouldUseUserToken } =
              await projectService.findProjectNodeId(
                appOctokit,
                userOctokit,
                projectOwner,
                projectNumber,
                request.log,
              );

            if (projId) {
              projectNodeId = projId;
              projectUseUserToken = shouldUseUserToken;

              const client =
                shouldUseUserToken && userOctokit ? userOctokit : appOctokit;
              excludeFieldsFromBody = await projectService.getMappableFieldIds({
                octokit: client,
                projectId: projId,
                formFields: input.formFields,
                log: request.log,
              });
            }
          } catch (e) {
            request.log.warn(
              { error: e instanceof Error ? e.message : "Unknown error" },
              "Failed to determine mappable project fields, including all fields in body",
            );
          }
        }

        // Build markdown body from validated form fields, excluding project-mapped fields
        let finalBody = submitService.buildMarkdownFromFields(
          input.formFields || {},
          input.fieldOrder,
          input.fieldLabels,
          excludeFieldsFromBody,
          form?.body, // Pass field configs to properly handle rating fields
        );

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
          issueType,
          formFields: input.formFields,
          log: request.log,
          owner,
          repo,
          appOctokit,
          userOctokit,
          projectOwner,
          projectNumber,
          projectNodeId,
          projectUseUserToken,
          storageType,
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
