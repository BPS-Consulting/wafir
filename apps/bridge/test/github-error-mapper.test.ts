/**
 * Tests for GitHub error mapper utility
 * Tests error mapping for various GitHub API error scenarios
 */
import { describe, it, expect } from "vitest";
import {
  mapGitHubError,
  withGitHubErrorMapping,
} from "../src/shared/utils/github-error-mapper.js";

describe("mapGitHubError", () => {
  describe("Installation errors", () => {
    it("maps 404 on installation operation to invalid installation message", () => {
      const error = {
        status: 404,
        message: "Not Found",
      };

      const result = mapGitHubError(error, { operation: "installation" });

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(
        "GitHub App installation is invalid or not installed for this repo/org.",
      );
    });

    it("maps 404 on token operation to invalid installation message", () => {
      const error = {
        response: {
          status: 404,
          data: {
            message: "Installation not found",
          },
        },
      };

      const result = mapGitHubError(error, { operation: "token" });

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(
        "GitHub App installation is invalid or not installed for this repo/org.",
      );
    });
  });

  describe("Permission errors", () => {
    it("maps 403 with 'resource not accessible' to permission error", () => {
      const error = {
        status: 403,
        message: "Resource not accessible by integration",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(403);
      expect(result.message).toContain(
        "The GitHub App does not have the required permissions",
      );
    });

    it("includes required permissions when header is present", () => {
      const error = {
        status: 403,
        message: "Resource not accessible by integration",
        response: {
          status: 403,
          data: {
            message: "Resource not accessible by integration",
          },
          headers: {
            "x-accepted-github-permissions": "issues=write,contents=read",
          },
        },
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(403);
      expect(result.message).toContain("issues=write,contents=read");
    });

    it("maps generic 403 to permission error", () => {
      const error = {
        status: 403,
        message: "Forbidden",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(403);
      expect(result.message).toContain("required permissions");
    });
  });

  describe("Resource not found errors", () => {
    it("maps 404 on repo operation to resource not found message", () => {
      const error = {
        status: 404,
        message: "Not Found",
      };

      const result = mapGitHubError(error, { operation: "repo" });

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(
        "The repository or project was not found or is not accessible by this app.",
      );
    });

    it("maps 404 on project operation to resource not found message", () => {
      const error = {
        status: 404,
        message: "Not Found",
      };

      const result = mapGitHubError(error, { operation: "project" });

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(
        "The repository or project was not found or is not accessible by this app.",
      );
    });

    it("maps 404 on issue operation to resource not found message", () => {
      const error = {
        response: {
          status: 404,
          data: {
            message: "Not Found",
          },
        },
      };

      const result = mapGitHubError(error, { operation: "issue" });

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(
        "The repository or project was not found or is not accessible by this app.",
      );
    });
  });

  describe("Authentication errors", () => {
    it("maps 401 to authentication failed message", () => {
      const error = {
        status: 401,
        message: "Bad credentials",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(401);
      expect(result.message).toBe(
        "GitHub authentication failed. The app's token may be invalid or expired.",
      );
    });

    it("maps 401 from response object", () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: "Requires authentication",
          },
        },
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(401);
      expect(result.message).toContain("authentication failed");
    });
  });

  describe("Rate limiting errors", () => {
    it("maps 429 to rate limit message", () => {
      const error = {
        status: 429,
        message: "API rate limit exceeded",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(429);
      expect(result.message).toBe(
        "GitHub API rate limit exceeded. Please try again later.",
      );
    });

    it("detects rate limit from message text", () => {
      const error = {
        status: 403,
        message: "You have exceeded a secondary rate limit",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(429);
      expect(result.message).toContain("rate limit");
    });
  });

  describe("GraphQL errors", () => {
    it("maps 'could not resolve' errors to resource not found", () => {
      const error = {
        message: "Could not resolve to a Repository with the name 'owner/repo'",
      };

      const result = mapGitHubError(error, { operation: "graphql" });

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(
        "The repository or project was not found or is not accessible by this app.",
      );
    });
  });

  describe("Unknown errors", () => {
    it("maps unknown error to generic message", () => {
      const error = {
        status: 500,
        message: "Internal Server Error",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe(
        "Unexpected GitHub API error. Please check your installation and app permissions.",
      );
    });

    it("defaults to 500 for errors without status", () => {
      const error = {
        message: "Something went wrong",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(500);
      expect(result.message).toContain("Unexpected GitHub API error");
    });

    it("handles errors with invalid status codes", () => {
      const error = {
        status: 999,
        message: "Invalid status",
      };

      const result = mapGitHubError(error);

      expect(result.statusCode).toBe(500); // Should default to 500 for out-of-range status
      expect(result.message).toContain("Unexpected GitHub API error");
    });
  });
});

describe("withGitHubErrorMapping", () => {
  it("returns successful result when function succeeds", async () => {
    const fn = async () => "success";

    const result = await withGitHubErrorMapping(fn);

    expect(result).toBe("success");
  });

  it("throws mapped error when function fails", async () => {
    const fn = async () => {
      const error: any = new Error("Not Found");
      error.status = 404;
      throw error;
    };

    await expect(
      withGitHubErrorMapping(fn, { operation: "repo" }),
    ).rejects.toThrow(
      "The repository or project was not found or is not accessible by this app.",
    );
  });

  it("throws error with statusCode property", async () => {
    const fn = async () => {
      const error: any = new Error("Forbidden");
      error.status = 403;
      error.message = "Resource not accessible by integration";
      throw error;
    };

    try {
      await withGitHubErrorMapping(fn);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain("required permissions");
    }
  });
});
