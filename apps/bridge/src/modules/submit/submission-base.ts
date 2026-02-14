// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

/**
 * Result from a submission operation
 */
export interface SubmissionResult {
  success: boolean;
  url?: string;
  number?: number;
  nodeId?: string;
  itemId?: string;
  projectAdded?: boolean;
  error?: string;
  warning?: string;
}

/**
 * Context provided to submission implementations
 */
export interface SubmissionContext {
  title: string;
  body: string;
  labels?: string[];
  rating?: number;
  submissionType?: "issue" | "feedback";
  formFields?: Record<string, unknown>;
  log: any;
}

/**
 * Abstract base class for all submission types
 * Provides a common interface for submitting issues, feedback, or other content
 * to various platforms (GitHub, Jira, GitLab, etc.)
 */
export abstract class SubmissionBase {
  /**
   * Main submission method - must be implemented by subclasses
   * @param context - The submission context containing title, body, labels, etc.
   * @returns A promise resolving to the submission result
   */
  abstract submit(context: SubmissionContext): Promise<SubmissionResult>;

  /**
   * Validates the submission context before processing
   * Override this method to add custom validation logic
   * @param context - The submission context to validate
   * @returns An array of validation error messages (empty if valid)
   */
  protected validate(context: SubmissionContext): string[] {
    const errors: string[] = [];

    if (!context.title || context.title.trim() === "") {
      errors.push("Title is required");
    }

    if (!context.body || context.body.trim() === "") {
      errors.push("Body is required");
    }

    return errors;
  }

  /**
   * Hook called before submission
   * Override this to perform pre-submission actions
   * @param context - The submission context
   */
  protected async beforeSubmit(context: SubmissionContext): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to add pre-submission logic
  }

  /**
   * Hook called after successful submission
   * Override this to perform post-submission actions
   * @param context - The submission context
   * @param result - The submission result
   */
  protected async afterSubmit(
    context: SubmissionContext,
    result: SubmissionResult,
  ): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to add post-submission logic
  }

  /**
   * Handles errors that occur during submission
   * Override this to customize error handling
   * @param error - The error that occurred
   * @param context - The submission context
   * @returns A submission result with error information
   */
  protected handleError(
    error: unknown,
    context: SubmissionContext,
  ): SubmissionResult {
    const message = error instanceof Error ? error.message : "Unknown error";
    context.log?.error({ error: message }, "Submission failed");

    return {
      success: false,
      error: message,
    };
  }
}
