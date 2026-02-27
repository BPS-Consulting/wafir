// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import {
  SubmissionBase,
  SubmissionContext,
  SubmissionResult,
} from "./submission-base.js";
import { GitHubProjectService } from "./github-project-service.js";
import { mapGitHubError } from "../../shared/utils/github-error-mapper.js";

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
  /** Pre-resolved project node ID (to avoid duplicate lookups) */
  projectNodeId?: string;
  /** Whether to use user token for project operations */
  projectUseUserToken?: boolean;
  storageType: "issue" | "project" | "both";
  /** Issue type (e.g., "bug", "feature") - requires repository to have issue types enabled */
  issueType?: string;
  /** Form fields to be mapped to project fields */
  formFields?: Record<string, unknown>;
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
    const shouldCreateIssue =
      context.storageType === "issue" || context.storageType === "both";
    const shouldAddToProject =
      context.projectNumber !== undefined &&
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
      try {
        const createParams: {
          owner: string;
          repo: string;
          title: string;
          body: string;
          labels: string[];
          type?: string;
        } = {
          owner: context.owner,
          repo: context.repo,
          title: context.title,
          body: context.body,
          // Use provided labels, or default to ["wafir-feedback"] if no labels specified
          labels:
            context.labels && context.labels.length > 0
              ? context.labels
              : ["wafir-feedback"],
        };

        // Add issue type if specified (requires repository to have issue types enabled)
        if (context.issueType) {
          createParams.type = context.issueType;
        }

        const issue = await context.appOctokit.rest.issues.create(createParams);
        issueData = {
          number: issue.data.number,
          url: issue.data.html_url,
          nodeId: issue.data.node_id,
        };
        context.log?.info({ issueNumber: issueData.number }, "Issue created");
      } catch (error: unknown) {
        const mapped = mapGitHubError(error, { operation: "issue" });
        throw new Error(mapped.message);
      }
    }

    // Add to project (as draft if project-only, or link existing issue if both)
    if (shouldAddToProject && context.projectNumber !== undefined) {
      const targetNodeId =
        context.storageType === "both" ? issueData.nodeId : undefined;

      projectResult = await this.projectService.addToProject({
        appOctokit: context.appOctokit,
        userOctokit: context.userOctokit,
        projectOwner: context.projectOwner!,
        projectNumber: context.projectNumber,
        projectNodeId: context.projectNodeId,
        projectUseUserToken: context.projectUseUserToken,
        title: context.title,
        body: context.body,
        issueNodeId: targetNodeId,
        log: context.log,
      });

      // Set project fields from form data
      if (projectResult.added && projectResult.itemId && context.formFields) {
        // Use pre-resolved project node ID if available, otherwise look it up
        let projId = context.projectNodeId;
        let shouldUseUserToken = context.projectUseUserToken ?? false;

        if (!projId) {
          const lookup = await this.projectService.findProjectNodeId(
            context.appOctokit,
            context.userOctokit,
            context.projectOwner!,
            context.projectNumber,
            context.log,
          );
          projId = lookup.nodeId;
          shouldUseUserToken = lookup.shouldUseUserToken;
        }

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
