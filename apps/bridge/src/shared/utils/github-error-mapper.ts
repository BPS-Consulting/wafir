// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

/**
 * GitHub Error Mapper
 *
 * Maps GitHub API errors to user-friendly, actionable messages.
 * This utility centralizes error handling for GitHub API interactions,
 * ensuring consistent, secure error reporting across the bridge.
 *
 * Key principles:
 * - No raw GitHub error details are exposed to clients
 * - Messages are actionable and developer-friendly
 * - Installation, permission, and resource access errors are clearly distinguished
 */

export interface GitHubError {
  status?: number;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
    headers?: {
      "x-accepted-github-permissions"?: string;
    };
  };
}

export interface MappedError {
  message: string;
  statusCode: number;
}

/**
 * Context for error mapping to provide better error messages
 */
export interface ErrorContext {
  operation?:
    | "installation"
    | "token"
    | "repo"
    | "project"
    | "issue"
    | "graphql";
}

/**
 * Maps GitHub API errors to user-friendly messages.
 *
 * @param error - The error object from the GitHub API
 * @param context - Optional context about the operation that failed
 * @returns A mapped error with a user-friendly message and appropriate status code
 */
export function mapGitHubError(
  error: unknown,
  context?: ErrorContext,
): MappedError {
  const githubError = error as GitHubError;
  const status = githubError.status || githubError.response?.status || 500;
  const message =
    githubError.message || githubError.response?.data?.message || "";
  const acceptedPermissions =
    githubError.response?.headers?.["x-accepted-github-permissions"];

  // Rate limiting (check before other errors as rate limit can be 403 or 429)
  if (status === 429 || message.toLowerCase().includes("rate limit")) {
    return {
      message: "GitHub API rate limit exceeded. Please try again later.",
      statusCode: 429,
    };
  }

  // Installation ID not found or invalid
  if (
    status === 404 &&
    (context?.operation === "installation" || context?.operation === "token")
  ) {
    return {
      message:
        "GitHub App installation is invalid or not installed for this repo/org.",
      statusCode: 404,
    };
  }

  // Insufficient permissions
  if (status === 403) {
    // Check for the specific "Resource not accessible" message
    if (message.toLowerCase().includes("resource not accessible")) {
      let permissionMessage =
        "The GitHub App does not have the required permissions, or wasn't granted access to this repository/project.";

      // If we have the accepted permissions header, include it in the message
      if (acceptedPermissions) {
        permissionMessage += ` Required permissions: ${acceptedPermissions}`;
      }

      return {
        message: permissionMessage,
        statusCode: 403,
      };
    }

    // Generic 403 - could be permissions or access
    return {
      message:
        "The GitHub App does not have the required permissions, or wasn't granted access to this repository/project.",
      statusCode: 403,
    };
  }

  // Repository or project not found/accessible
  if (
    status === 404 &&
    (context?.operation === "repo" ||
      context?.operation === "project" ||
      context?.operation === "issue")
  ) {
    return {
      message:
        "The repository or project was not found or is not accessible by this app.",
      statusCode: 404,
    };
  }

  // Authentication/token errors
  if (status === 401) {
    return {
      message:
        "GitHub authentication failed. The app's token may be invalid or expired.",
      statusCode: 401,
    };
  }

  // GraphQL errors (might not have standard status codes)
  if (
    context?.operation === "graphql" &&
    message.toLowerCase().includes("could not resolve")
  ) {
    return {
      message:
        "The repository or project was not found or is not accessible by this app.",
      statusCode: 404,
    };
  }

  // Fallback for any other errors
  return {
    message:
      "Unexpected GitHub API error. Please check your installation and app permissions.",
    statusCode: status >= 400 && status < 600 ? status : 500,
  };
}

/**
 * Wraps an async GitHub API call with error mapping.
 *
 * @param fn - The async function to execute
 * @param context - Optional context about the operation
 * @returns The result of the function or throws a mapped error
 */
export async function withGitHubErrorMapping<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const mapped = mapGitHubError(error, context);
    const enhancedError = new Error(mapped.message) as Error & {
      statusCode: number;
    };
    enhancedError.statusCode = mapped.statusCode;
    throw enhancedError;
  }
}
