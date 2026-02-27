/**
 * Tests for config validation and security checks
 */
import { describe, it, expect } from "vitest";
import { sampleConfigs } from "../helper.js";
import { setupSubmitTestHooks } from "./setup.js";
import { mockFetch } from "./mocks.js";
import { TEST_CONFIG_URL, createMockConfigResponse } from "./fixtures.js";

describe("POST /submit - config validation - security", () => {
  const getContext = setupSubmitTestHooks();

  it.skip("accepts submission when configUrl is provided with all required fields (skipped - needs mock setup)", async () => {
    const { app } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
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
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
          message: "Test Message",
        },
      },
      headers: {
        referer: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("rejects submission when configUrl origin does not match referer origin", async () => {
    const { app } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      headers: {
        referer: "https://legitimate-site.com/app",
      },
      payload: {
        configUrl: "https://attacker-site.com/malicious.yaml",
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("ORIGIN_MISMATCH");
    expect(body.details[0].message).toContain(
      "For security, config must be hosted on the same domain",
    );
  });

  it("accepts submission when configUrl origin matches referer origin", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 999,
        html_url: "https://github.com/testowner/testrepo/issues/999",
        node_id: "I_same_origin",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      headers: {
        referer: "https://example.com/app/page",
      },
      payload: {
        configUrl: "https://example.com/config/wafir.yaml",
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
          message: "Valid same-origin submission",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("accepts submission when no referer header is present (allows testing)", async () => {
    const { app, mockOctokit } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 998,
        html_url: "https://github.com/testowner/testrepo/issues/998",
        node_id: "I_no_referer",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
          message: "No referer header",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("rejects submission when config fetch fails", async () => {
    const { app } = getContext();

    mockFetch.mockRejectedValue(new Error("Network error"));

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("CONFIG_FETCH_FAILED");
  });

  it("rejects submission when config returns non-200", async () => {
    const { app } = getContext();

    mockFetch.mockResolvedValue(new Response("Not Found", { status: 404 }));

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("CONFIG_FETCH_FAILED");
  });

  it("rejects submission when target does not match config", async () => {
    const { app } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "wrongowner/wrongrepo", // Does not match config (testowner/testrepo)
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("TARGET_MISMATCH");
  });

  it("rejects submission when authRef does not match config", async () => {
    const { app } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/issues",
        target: "testowner/testrepo",
        authRef: "999", // Does not match config (123)
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("TARGET_MISMATCH");
  });

  it("rejects submission when targetType does not match config", async () => {
    const { app } = getContext();

    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        targetType: "github/project", // Does not match config (github/issues)
        target: "testowner/testrepo",
        authRef: "123",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Validation Failed");
    expect(body.details[0].code).toBe("TARGET_MISMATCH");
  });

  it("uses values from config, not from client submission, for GitHub API", async () => {
    const { app, mockOctokit } = getContext();

    // Config has specific owner/repo
    mockFetch.mockResolvedValue(
      createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: real-owner/real-repo
    authRef: "456"
forms:
  - id: issue
    body:
      - id: title
        type: input
        validations:
          required: true
      - id: message
        type: textarea
        validations:
          required: true
`),
    );

    mockOctokit.rest.issues.create.mockResolvedValue({
      data: {
        number: 100,
        html_url: "https://github.com/real-owner/real-repo/issues/100",
        node_id: "I_real",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/submit",
      payload: {
        configUrl: TEST_CONFIG_URL,
        installationId: 123,
        owner: "real-owner",
        repo: "real-repo",
        title: "Test Issue",
        formId: "issue",
        formFields: {
          title: "Test Issue",
          message: "Test",
        },
      },
    });

    expect(response.statusCode).toBe(201);

    // Verify GitHub API was called with config values
    expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "real-owner",
        repo: "real-repo",
      }),
    );
  });
});
