/**
 * Tests for error handling
 */
import { describe, it, expect } from "vitest";
import { setupSubmitTestHooks } from "./setup.js";
import { TEST_CONFIG_URL } from "./fixtures.js";

describe("POST /submit - error handling", () => {
  const getContext = setupSubmitTestHooks();

  it("returns 400 for missing required fields", async () => {
    const { app } = getContext();

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        // Missing repo and title
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain("Missing required");
  });

  it("returns 400 when title is missing", async () => {
    const { app } = getContext();

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        formId: "issue",
        formFields: {
          message: "No title provided",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain("Missing required field: title");
  });

  it("returns 500 when GitHub issue creation fails", async () => {
    const { app, mockOctokit } = getContext();

    mockOctokit.rest.issues.create.mockRejectedValue(
      new Error("GitHub API error: rate limit exceeded"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "This will fail",
        formId: "issue",
        formFields: {
          title: "This will fail",
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Submission Failed");
    expect(body.message).toContain("rate limit exceeded");
  });
});
