/**
 * Tests for the /submit endpoint
 * Tests submission to GitHub issues and projects with mocked GitHub API and S3
 * Includes validation tests for configUrl-based security
 */
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
  setupTestEnv,
  createMockOctokit,
  createMockTokenStore,
  sampleConfigs,
  MockOctokit,
  MockTokenStore,
} from "./helper.js";

// Create a shared mock send function that we can control
const mockS3Send = vi.fn();

// Create a mock fetch for config URL fetching
const mockFetch = vi.fn();

// Mock the S3 client module before importing the route
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class MockS3Client {
      send = mockS3Send;
    },
    PutObjectCommand: class MockPutObjectCommand {
      constructor(public params: unknown) {}
    },
    GetObjectCommand: class MockGetObjectCommand {
      constructor(public params: unknown) {}
    },
    DeleteObjectCommand: class MockDeleteObjectCommand {
      constructor(public params: unknown) {}
    },
    HeadObjectCommand: class MockHeadObjectCommand {
      constructor(public params: unknown) {}
    },
  };
});

// Import the submit route after mocking
import submitRoute from "../src/modules/submit/routes.js";

// Sample config URL for tests
const TEST_CONFIG_URL = "https://example.com/wafir.yaml";

// Helper to create a mock fetch response for config
function createMockConfigResponse(yamlContent: string): Response {
  return new Response(yamlContent, {
    status: 200,
    headers: { "content-type": "text/yaml" },
  });
}

describe("POST /submit", () => {
  let app: FastifyInstance;
  let mockOctokit: MockOctokit;
  let mockTokenStore: MockTokenStore;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    setupTestEnv();
    mockOctokit = createMockOctokit();
    mockTokenStore = createMockTokenStore();
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});
    mockFetch.mockReset();

    // Save and replace global fetch
    originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;

    app = Fastify({ logger: false });

    // Register mock GitHub plugin
    await app.register(
      fp(async (fastify) => {
        fastify.decorate(
          "getGitHubClient",
          vi.fn().mockResolvedValue(mockOctokit),
        );
        fastify.decorate(
          "getGitHubClientWithToken",
          vi.fn().mockReturnValue(mockOctokit),
        );
      }),
    );

    // Register mock token store plugin
    await app.register(
      fp(async (fastify) => {
        fastify.decorate("tokenStore", mockTokenStore);
      }),
    );

    // Register sensible for error handling
    await app.register(import("@fastify/sensible"));

    // Register multipart for file uploads
    await app.register(import("@fastify/multipart"));

    // Register the submit route
    await app.register(submitRoute, { prefix: "/submit" });
    await app.ready();

    // Default mock for config fetch - returns minimal config
    mockFetch.mockResolvedValue(
      createMockConfigResponse(sampleConfigs.minimal),
    );
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe("successful issue submission", () => {
    it("creates a GitHub issue with valid submission data", async () => {
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 42,
          html_url: "https://github.com/testowner/testrepo/issues/42",
          node_id: "I_abc123",
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
            message: "This is a test description",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(42);
      expect(body.issueUrl).toBe(
        "https://github.com/testowner/testrepo/issues/42",
      );

      // Verify issue was created with correct parameters
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
        owner: "testowner",
        repo: "testrepo",
        title: "Test Issue",
        body: expect.stringContaining("Message"),
        labels: ["wafir-feedback"],
        type: "issue", // Form id is used as issue type
      });

      // Verify config was fetched
      expect(mockFetch).toHaveBeenCalledWith(
        TEST_CONFIG_URL,
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("creates issue with custom labels", async () => {
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 43,
          html_url: "https://github.com/testowner/testrepo/issues/43",
          node_id: "I_abc124",
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
          title: "Bug Report",
          formId: "issue",
          labels: ["bug", "priority-high"],
          formFields: {
            title: "Bug Report",
            message: "1. Click button\n2. See error",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ["bug", "priority-high"],
        }),
      );
    });

    it("builds markdown body from form fields in correct order", async () => {
      // Use full config with custom fields
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    fields:
      - id: title
        type: input
      - id: description
        type: textarea
      - id: steps
        type: textarea
      - id: expected
        type: textarea
`),
      );

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 44,
          html_url: "https://github.com/testowner/testrepo/issues/44",
          node_id: "I_abc125",
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
          title: "Ordered Fields Test",
          formId: "issue",
          formFields: {
            title: "Ordered Fields Test",
            description: "First field",
            steps: "Second field",
            expected: "Third field",
          },
          fieldOrder: ["description", "steps", "expected"],
        },
      });

      expect(response.statusCode).toBe(201);

      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      const body = createCall.body;

      // Check fields appear in order
      const descPos = body.indexOf("Description");
      const stepsPos = body.indexOf("Steps");
      const expectedPos = body.indexOf("Expected");

      expect(descPos).toBeLessThan(stepsPos);
      expect(stepsPos).toBeLessThan(expectedPos);
    });

    it("converts rating to star emojis in body", async () => {
      // Config with feedback form that has rating field
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
      - id: title
        type: input
      - id: rating
        type: rating
      - id: comment
        type: textarea
`),
      );

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 45,
          html_url: "https://github.com/testowner/testrepo/issues/45",
          node_id: "I_abc126",
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
          title: "Feedback with Rating",
          formId: "feedback",
          formFields: {
            title: "Feedback with Rating",
            rating: 4,
            comment: "Great product!",
          },
        },
      });

      expect(response.statusCode).toBe(201);

      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      expect(createCall.body).toContain("⭐⭐⭐⭐");
    });

    it("includes browser info in issue body when provided", async () => {
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 46,
          html_url: "https://github.com/testowner/testrepo/issues/46",
          node_id: "I_abc127",
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
          title: "Issue with Browser Info",
          formId: "issue",
          formFields: {
            title: "Issue with Browser Info",
            message: "A bug",
          },
          browserInfo: {
            url: "https://example.com/page",
            userAgent: "Mozilla/5.0 (Test)",
            viewportWidth: 1920,
            viewportHeight: 1080,
            language: "en-US",
          },
        },
      });

      expect(response.statusCode).toBe(201);

      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      expect(createCall.body).toContain("Browser Info");
      expect(createCall.body).toContain("https://example.com/page");
      expect(createCall.body).toContain("Mozilla/5.0 (Test)");
      expect(createCall.body).toContain("1920x1080");
      expect(createCall.body).toContain("en-US");
    });

    it("includes console logs in issue body when provided", async () => {
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 47,
          html_url: "https://github.com/testowner/testrepo/issues/47",
          node_id: "I_abc128",
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
          title: "Issue with Console Logs",
          formId: "issue",
          formFields: {
            title: "Issue with Console Logs",
            message: "Error occurred",
          },
          consoleLogs: [
            {
              type: "error",
              message: "Uncaught TypeError",
              timestamp: "2024-01-01T00:00:00Z",
            },
            {
              type: "warn",
              message: "Deprecated API",
              timestamp: "2024-01-01T00:00:01Z",
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);

      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      expect(createCall.body).toContain("Console Logs");
      expect(createCall.body).toContain("[ERROR] Uncaught TypeError");
      expect(createCall.body).toContain("[WARN] Deprecated API");
    });

    it("gets title from formFields if not provided directly", async () => {
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 48,
          html_url: "https://github.com/testowner/testrepo/issues/48",
          node_id: "I_abc129",
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
          formId: "issue",
          formFields: {
            title: "Title from Form Fields",
            message: "Some description",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Title from Form Fields",
        }),
      );
    });
  });

  describe("config validation - security", () => {
    it.skip("accepts submission when configUrl is provided with all required fields (skipped - needs mock setup)", async () => {
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
    fields:
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

  describe("form field validation", () => {
    it("rejects submission with extra fields not in config", async () => {
      // Config with specific fields
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
      - id: title
        type: input
      - id: message
        type: textarea
`),
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
          formId: "feedback",
          formFields: {
            title: "Test Issue",
            message: "Valid field",
            maliciousField: "Should be rejected", // Not in config
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Validation Failed");
      expect(body.details[0].code).toBe("UNKNOWN_FIELD");
      expect(body.details[0].field).toBe("maliciousField");
    });

    it("rejects submission with missing required fields", async () => {
      // Config with required field
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
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
          formId: "feedback",
          formFields: {
            title: "Test Issue",
            // message is missing but required
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Validation Failed");
      expect(
        body.details.some(
          (e: { code: string }) => e.code === "MISSING_REQUIRED_FIELD",
        ),
      ).toBe(true);
    });

    it("rejects submission with invalid email format", async () => {
      // Config with email field
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
      - id: title
        type: input
      - id: email
        type: email
      - id: message
        type: textarea
`),
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
          formId: "feedback",
          formFields: {
            title: "Test Issue",
            email: "not-an-email",
            message: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Validation Failed");
      expect(body.details[0].code).toBe("INVALID_EMAIL");
    });

    it("rejects submission with invalid rating value", async () => {
      // Config with rating field
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
      - id: title
        type: input
      - id: rating
        type: rating
      - id: message
        type: textarea
`),
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
          formId: "feedback",
          formFields: {
            title: "Test Issue",
            rating: 10, // Invalid: must be 1-5
            message: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Validation Failed");
      expect(body.details[0].code).toBe("INVALID_RATING");
    });

    it("rejects submission with invalid dropdown value", async () => {
      // Config with dropdown field
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
      - id: title
        type: input
      - id: category
        type: dropdown
        attributes:
          options:
            - Bug
            - Feature
            - Question
      - id: message
        type: textarea
`),
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
          formId: "feedback",
          formFields: {
            title: "Test Issue",
            category: "InvalidOption", // Not in options
            message: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Validation Failed");
      expect(body.details[0].code).toBe("INVALID_DROPDOWN_VALUE");
    });

    it("accepts valid submission with all field types", async () => {
      // Config with multiple field types
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: feedback
    fields:
      - id: title
        type: input
      - id: email
        type: email
      - id: rating
        type: rating
      - id: category
        type: dropdown
        attributes:
          options:
            - Bug
            - Feature
      - id: message
        type: textarea
`),
      );

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 200,
          html_url: "https://github.com/testowner/testrepo/issues/200",
          node_id: "I_valid",
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
          formId: "feedback",
          formFields: {
            title: "Test Issue",
            email: "valid@example.com",
            rating: 5,
            category: "Bug",
            message: "This is a valid submission",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe("screenshot upload to S3", () => {
    it("uploads screenshot to S3 and includes in issue body", async () => {
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 50,
          html_url: "https://github.com/testowner/testrepo/issues/50",
          node_id: "I_abc130",
        },
      });

      // Use multipart form data
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const screenshotBuffer = Buffer.from("fake-png-data");

      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="configUrl"',
        "",
        TEST_CONFIG_URL,
        `--${boundary}`,
        'Content-Disposition: form-data; name="installationId"',
        "",
        "123",
        `--${boundary}`,
        'Content-Disposition: form-data; name="owner"',
        "",
        "testowner",
        `--${boundary}`,
        'Content-Disposition: form-data; name="repo"',
        "",
        "testrepo",
        `--${boundary}`,
        'Content-Disposition: form-data; name="title"',
        "",
        "Issue with Screenshot",
        `--${boundary}`,
        'Content-Disposition: form-data; name="formId"',
        "",
        "issue",
        `--${boundary}`,
        'Content-Disposition: form-data; name="formFields"',
        "",
        '{"title":"Issue with Screenshot","message":"Bug with screenshot"}',
        `--${boundary}`,
        'Content-Disposition: form-data; name="screenshot"; filename="screenshot.png"',
        "Content-Type: image/png",
        "",
        screenshotBuffer.toString(),
        `--${boundary}--`,
      ].join("\r\n");

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      });

      expect(response.statusCode).toBe(201);

      // Verify S3 upload was called
      expect(mockS3Send).toHaveBeenCalled();

      // Verify issue body contains screenshot URL
      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      expect(createCall.body).toContain("![Screenshot]");
      expect(createCall.body).toContain(
        "https://test-bucket.s3.us-east-1.amazonaws.com/snapshots/",
      );
    });

    it("continues without screenshot if S3 upload fails", async () => {
      mockS3Send.mockRejectedValue(new Error("S3 upload failed"));

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 51,
          html_url: "https://github.com/testowner/testrepo/issues/51",
          node_id: "I_abc131",
        },
      });

      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";

      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="configUrl"',
        "",
        TEST_CONFIG_URL,
        `--${boundary}`,
        'Content-Disposition: form-data; name="installationId"',
        "",
        "123",
        `--${boundary}`,
        'Content-Disposition: form-data; name="owner"',
        "",
        "testowner",
        `--${boundary}`,
        'Content-Disposition: form-data; name="repo"',
        "",
        "testrepo",
        `--${boundary}`,
        'Content-Disposition: form-data; name="title"',
        "",
        "Issue with Failed Screenshot",
        `--${boundary}`,
        'Content-Disposition: form-data; name="formId"',
        "",
        "issue",
        `--${boundary}`,
        'Content-Disposition: form-data; name="formFields"',
        "",
        '{"title":"Issue with Failed Screenshot","message":"Bug"}',
        `--${boundary}`,
        'Content-Disposition: form-data; name="screenshot"; filename="screenshot.png"',
        "Content-Type: image/png",
        "",
        "fake-png-data",
        `--${boundary}--`,
      ].join("\r\n");

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      });

      // Should still succeed, just without screenshot
      expect(response.statusCode).toBe(201);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(true);

      // Issue should not contain screenshot
      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      expect(createCall.body).not.toContain("![Screenshot]");
    });
  });

  describe("project-based submission", () => {
    it("adds draft issue to project when target type is github/project", async () => {
      // Config with ONLY project storage
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: github-project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    fields:
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

      // Mock finding the project
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_abc123" } },
      });

      // Mock adding draft to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2DraftIssue: {
          projectItem: { id: "PVTI_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/project",
          target: "testowner/1",
          authRef: "123",
          title: "Project Draft Issue",
          formId: "issue",
          formFields: {
            title: "Project Draft Issue",
            message: "This goes to a project",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.projectAdded).toBe(true);

      // Issue should NOT be created (project only)
      expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();
    });

    it("returns warning when project cannot be found", async () => {
      // Config with ONLY project storage
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: github-project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    fields:
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

      // Mock project not found for both org and user
      mockOctokit.graphql.mockRejectedValue(new Error("Project not found"));

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/project",
          target: "testowner/1",
          authRef: "123",
          title: "Project Issue",
          formId: "issue",
          formFields: {
            title: "Project Issue",
            message: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.projectAdded).toBe(false);
      expect(body.warning).toContain("Could not find project");
    });
  });

  describe("error handling", () => {
    it("returns 400 for missing required fields", async () => {
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
      expect(body.message).toContain("GitHub API error");
    });
  });

  describe("multiple targets (issue + project)", () => {
    it("creates issue and adds to project when targets include both github/issues and github/project", async () => {
      // Config with both target types
      mockFetch.mockResolvedValue(createMockConfigResponse(sampleConfigs.full));

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 60,
          html_url: "https://github.com/testowner/testrepo/issues/60",
          node_id: "I_issue60",
        },
      });

      // Mock finding the project
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_both123" } },
      });

      // Mock adding issue to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2ItemById: {
          item: { id: "PVTI_both_item123" },
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
          title: "Issue for Both",
          formId: "issue",
          formFields: {
            title: "Issue for Both",
            message: "Goes to issue and project",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(60);
      expect(body.projectAdded).toBe(true);

      // Both issue creation and project addition should happen
      expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
      expect(mockOctokit.graphql).toHaveBeenCalled();
    });
  });

  describe("form-specific target routing", () => {
    it("routes submission to only targets specified in form.targets array", async () => {
      // Config with multiple targets, but form only uses one
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: issue
    targets: [default]
    fields:
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
          html_url: "https://github.com/testowner/testrepo/issues/100",
          node_id: "I_target_test",
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/issues",
          target: "testowner/testrepo",
          authRef: "123",
          title: "Issue Only",
          formId: "issue",
          formFields: {
            title: "Issue Only",
            message: "Should only go to issues, not project",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(100);

      // Issue should be created
      expect(mockOctokit.rest.issues.create).toHaveBeenCalled();

      // Project should NOT be accessed (no graphql calls)
      expect(mockOctokit.graphql).not.toHaveBeenCalled();
    });

    it("routes submission to multiple targets when form.targets includes multiple IDs", async () => {
      // Config with form specifying both targets
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: feedback
    targets: [default, project]
    fields:
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
          number: 101,
          html_url: "https://github.com/testowner/testrepo/issues/101",
          node_id: "I_multi_target",
        },
      });

      // Mock finding the project
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_multi123" } },
      });

      // Mock adding issue to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2ItemById: {
          item: { id: "PVTI_multi_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/issues",
          target: "testowner/testrepo",
          authRef: "123",
          title: "Both Targets",
          formId: "feedback",
          formFields: {
            title: "Both Targets",
            message: "Should go to both issues and project",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(101);
      expect(body.projectAdded).toBe(true);

      // Both issue and project should be used
      expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
      expect(mockOctokit.graphql).toHaveBeenCalled();
    });

    it("routes to all targets when form.targets is omitted", async () => {
      // Config with multiple targets, form has no targets specified
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: suggestion
    fields:
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
          number: 102,
          html_url: "https://github.com/testowner/testrepo/issues/102",
          node_id: "I_all_targets",
        },
      });

      // Mock finding the project
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_all123" } },
      });

      // Mock adding issue to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2ItemById: {
          item: { id: "PVTI_all_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/issues",
          target: "testowner/testrepo",
          authRef: "123",
          title: "Default to All",
          formId: "suggestion",
          formFields: {
            title: "Default to All",
            message: "Should go to all targets by default",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(102);
      expect(body.projectAdded).toBe(true);

      // Both issue and project should be used
      expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
      expect(mockOctokit.graphql).toHaveBeenCalled();
    });

    it("routes to all targets when form.targets is empty array", async () => {
      // Config with form specifying empty targets array
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: feedback
    targets: []
    fields:
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
          number: 103,
          html_url: "https://github.com/testowner/testrepo/issues/103",
          node_id: "I_empty_targets",
        },
      });

      // Mock finding the project
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_empty123" } },
      });

      // Mock adding issue to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2ItemById: {
          item: { id: "PVTI_empty_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/issues",
          target: "testowner/testrepo",
          authRef: "123",
          title: "Empty Targets",
          formId: "feedback",
          formFields: {
            title: "Empty Targets",
            message: "Empty array means all targets",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(103);
      expect(body.projectAdded).toBe(true);

      // Both issue and project should be used
      expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
      expect(mockOctokit.graphql).toHaveBeenCalled();
    });

    it("routes to only project when form.targets specifies only project", async () => {
      // Config with form specifying only project target
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
  - id: project
    type: github/project
    target: testowner/1
    authRef: "123"
forms:
  - id: feedback
    targets: [project]
    fields:
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

      // Mock finding the project
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_proj_only123" } },
      });

      // Mock adding draft to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2DraftIssue: {
          projectItem: { id: "PVTI_proj_only_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/project",
          target: "testowner/1",
          authRef: "123",
          title: "Project Only",
          formId: "feedback",
          formFields: {
            title: "Project Only",
            message: "Should only go to project, not issues",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.projectAdded).toBe(true);

      // Issue should NOT be created
      expect(mockOctokit.rest.issues.create).not.toHaveBeenCalled();

      // Project should be accessed
      expect(mockOctokit.graphql).toHaveBeenCalled();
    });

    it("rejects submission when form.targets references unknown target ID", async () => {
      // Config with form referencing non-existent target
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: default
    type: github/issues
    target: testowner/testrepo
    authRef: "123"
forms:
  - id: issue
    targets: [nonexistent]
    fields:
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

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/issues",
          target: "testowner/testrepo",
          authRef: "123",
          title: "Invalid Target",
          formId: "issue",
          formFields: {
            title: "Invalid Target",
            message: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Validation Failed");
      // Config validation should catch the unknown target reference
      expect(body.details[0].message).toContain("unknown target ID");
    });
  });

  describe("user token for projects", () => {
    it("uses user token for user projects when available", async () => {
      // Config with ONLY project storage (user project)
      mockFetch.mockResolvedValue(
        createMockConfigResponse(`
targets:
  - id: github-project
    type: github/project
    target: testuser/1
    authRef: "123"
forms:
  - id: issue
    fields:
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

      // User token is available
      mockTokenStore.getUserToken.mockResolvedValue("user-oauth-token");

      // Org project lookup fails
      mockOctokit.graphql.mockRejectedValueOnce(new Error("Not found"));

      // User project lookup succeeds
      mockOctokit.graphql.mockResolvedValueOnce({
        user: { projectV2: { id: "PVT_user123" } },
      });

      // Add draft succeeds
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2DraftIssue: {
          projectItem: { id: "PVTI_user_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          configUrl: TEST_CONFIG_URL,
          targetType: "github/project",
          target: "testuser/1",
          authRef: "123",
          title: "User Project Issue",
          formId: "issue",
          formFields: {
            title: "User Project Issue",
            message: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.projectAdded).toBe(true);
    });
  });
});
