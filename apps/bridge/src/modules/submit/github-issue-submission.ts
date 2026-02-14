// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import {
  SubmissionBase,
  SubmissionContext,
  SubmissionResult,
} from "./submission-base.js";
import { GitHubProjectService } from "./github-project-service.js";

/**
 * GitHub-specific submission context
 */
export interface GithubSubmissionContext extends SubmissionContext {
  owner: string;
  repo: string;
  appOctokit: any;
  userOctokit?: any | null;
  projectOwner?: string;
  projectNumber?: number;
  storageType: "issue" | "project" | "both";
  feedbackProjectNumber?: number;
  feedbackProjectOwner?: string;
  ratingFieldName?: string;
}

/**
 * GitHub Issue submission implementation
 * Handles creating GitHub issues and/or adding items to GitHub Projects V2
 */
export class GithubIssueSubmission extends SubmissionBase {
  private projectService: GitHubProjectService;

  constructor() {
    super();
    this.projectService = new GitHubProjectService();
  }

  /**
   * Submits an issue to GitHub and optionally adds it to a project
   */
  async submit(context: SubmissionContext): Promise<SubmissionResult> {
    const githubContext = context as GithubSubmissionContext;

    // Validate context
    const validationErrors = this.validate(githubContext);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(", ")}`,
      };
    }

    // Run pre-submission hooks
    await this.beforeSubmit(githubContext);

    try {
      const result = await this.performSubmission(githubContext);

      // Run post-submission hooks
      await this.afterSubmit(githubContext, result);

      return result;
    } catch (error: unknown) {
      return this.handleError(error, githubContext);
    }
  }

  /**
   * Validates GitHub-specific context
   */
  protected validate(context: GithubSubmissionContext): string[] {
    const errors = super.validate(context);

    if (!context.appOctokit) {
      errors.push("GitHub client (appOctokit) is required");
    }

    // For issue or both storage types, owner and repo are required
    if (context.storageType === "issue" || context.storageType === "both") {
      if (!context.owner) {
        errors.push("Owner is required for issue storage");
      }
      if (!context.repo) {
        errors.push("Repository is required for issue storage");
      }
    }

    // For project or both storage types, project info is required
    if (context.storageType === "project" || context.storageType === "both") {
      if (!context.projectOwner) {
        errors.push("Project owner is required for project storage");
      }
      if (context.projectNumber === undefined) {
        errors.push("Project number is required for project storage");
      }
    }

    return errors;
  }

  /**
   * Performs the actual GitHub submission
   */
  private async performSubmission(
    context: GithubSubmissionContext,
  ): Promise<SubmissionResult> {
    const isFeedback = context.submissionType === "feedback";
    const shouldCreateIssue =
      !isFeedback &&
      (context.storageType === "issue" || context.storageType === "both");
    const shouldAddToProject =
      context.projectNumber !== undefined &&
      !isFeedback &&
      (context.storageType === "project" || context.storageType === "both");

    let issueData: {
      number?: number;
      url?: string;
      nodeId?: string;
    } = {};
    let projectResult: { added: boolean; error?: string; itemId?: string } = {
      added: false,
    };

    // Create GitHub Issue
    if (shouldCreateIssue) {
      const issue = await context.appOctokit.rest.issues.create({
        owner: context.owner,
        repo: context.repo,
        title: context.title,
        body: context.body,
        labels: context.labels || ["wafir-feedback"],
      });
      issueData = {
        number: issue.data.number,
        url: issue.data.html_url,
        nodeId: issue.data.node_id,
      };
      context.log?.info({ issueNumber: issueData.number }, "Issue created");
    }

    // Add to project
    if (shouldAddToProject && context.projectNumber !== undefined) {
      const targetNodeId =
        context.storageType === "both" ? issueData.nodeId : undefined;

      projectResult = await this.projectService.addToProject({
        appOctokit: context.appOctokit,
        userOctokit: context.userOctokit,
        projectOwner: context.projectOwner!,
        projectNumber: context.projectNumber,
        title: context.title,
        body: context.body,
        issueNodeId: targetNodeId,
        log: context.log,
      });

      // Set project fields from form data
      if (projectResult.added && projectResult.itemId && context.formFields) {
        const { nodeId: projId, shouldUseUserToken } =
          await this.projectService.findProjectNodeId(
            context.appOctokit,
            context.userOctokit,
            context.projectOwner!,
            context.projectNumber,
            context.log,
          );

        if (projId) {
          const client =
            shouldUseUserToken && context.userOctokit
              ? context.userOctokit
              : context.appOctokit;

          await this.projectService.setProjectFields({
            octokit: client,
            projectId: projId,
            itemId: projectResult.itemId,
            formFields: context.formFields,
            log: context.log,
          });
        }
      }
    }

    // Handle feedback submissions
    if (isFeedback && context.feedbackProjectNumber) {
      const { nodeId: feedbackProjId, shouldUseUserToken } =
        await this.projectService.findProjectNodeId(
          context.appOctokit,
          context.userOctokit,
          context.feedbackProjectOwner!,
          context.feedbackProjectNumber,
          context.log,
        );

      if (feedbackProjId) {
        projectResult = await this.projectService.addToProject({
          appOctokit: context.appOctokit,
          userOctokit: context.userOctokit,
          projectOwner: context.feedbackProjectOwner!,
          projectNumber: context.feedbackProjectNumber,
          title: context.title,
          body: context.body,
          log: context.log,
        });

        // Set project fields from form data (includes rating as a NUMBER field)
        if (projectResult.added && projectResult.itemId && context.formFields) {
          const client =
            shouldUseUserToken && context.userOctokit
              ? context.userOctokit
              : context.appOctokit;

          await this.projectService.setProjectFields({
            octokit: client,
            projectId: feedbackProjId,
            itemId: projectResult.itemId,
            formFields: context.formFields,
            log: context.log,
          });
        }
      } else {
        projectResult.error = "Could not find feedback project";
      }
    }

    // Fallback: create issue for feedback if no project configured
    if (isFeedback && !context.feedbackProjectNumber) {
      const issue = await context.appOctokit.rest.issues.create({
        owner: context.owner,
        repo: context.repo,
        title: context.title,
        body: context.body,
        labels: context.labels || ["wafir-feedback"],
      });
      issueData = {
        number: issue.data.number,
        url: issue.data.html_url,
        nodeId: issue.data.node_id,
      };
      context.log?.info(
        { issueNumber: issueData.number },
        "Feedback issue created (no project configured)",
      );
    }

    return {
      success: true,
      url: issueData.url,
      number: issueData.number,
      nodeId: issueData.nodeId,
      itemId: projectResult.itemId,
      projectAdded: projectResult.added,
      warning: projectResult.error,
    };
  }
}
