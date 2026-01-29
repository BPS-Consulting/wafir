/**
 * Tests for the /submit endpoint
 * Tests submission to GitHub issues and projects with mocked GitHub API and S3
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
  setupTestEnv,
  createMockOctokit,
  createMockTokenStore,
  encodeYamlToBase64,
  sampleConfigs,
  MockOctokit,
  MockTokenStore,
} from "./helper.js";

// Create a shared mock send function that we can control
const mockS3Send = vi.fn();

// Mock the S3 client module before importing the route
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class MockS3Client {
      send = mockS3Send;
    },
    PutObjectCommand: class MockPutObjectCommand {
      constructor(public params: any) {}
    },
    GetObjectCommand: class MockGetObjectCommand {
      constructor(public params: any) {}
    },
    DeleteObjectCommand: class MockDeleteObjectCommand {
      constructor(public params: any) {}
    },
    HeadObjectCommand: class MockHeadObjectCommand {
      constructor(public params: any) {}
    },
  };
});

// Import the submit route after mocking
import submitRoute from "../src/routes/submit.js";

describe("POST /submit", () => {
  let app: FastifyInstance;
  let mockOctokit: MockOctokit;
  let mockTokenStore: MockTokenStore;

  beforeEach(async () => {
    setupTestEnv();
    mockOctokit = createMockOctokit();
    mockTokenStore = createMockTokenStore();
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});

    app = Fastify({ logger: false });

    // Register mock GitHub plugin
    await app.register(
      fp(async (fastify) => {
        (fastify as any).decorate(
          "getGitHubClient",
          vi.fn().mockResolvedValue(mockOctokit),
        );
        (fastify as any).decorate(
          "getGitHubClientWithToken",
          vi.fn().mockReturnValue(mockOctokit),
        );
      }),
    );

    // Register mock token store plugin
    await app.register(
      fp(async (fastify) => {
        (fastify as any).decorate("tokenStore", mockTokenStore);
      }),
    );

    // Register sensible for error handling
    await app.register(import("@fastify/sensible"));

    // Register multipart for file uploads
    await app.register(import("@fastify/multipart"));

    // Register the submit route
    await app.register(submitRoute);
    await app.ready();

    // Default mock for config (no wafir.yaml - uses defaults)
    mockOctokit.rest.repos.getContent.mockRejectedValue({ status: 404 });
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Test Issue",
          formFields: {
            description: "This is a test description",
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
        body: expect.stringContaining("Description"),
        labels: ["wafir-feedback"],
      });
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Bug Report",
          labels: ["bug", "priority-high"],
          formFields: {
            steps: "1. Click button\n2. See error",
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Ordered Fields Test",
          formFields: {
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Feedback with Rating",
          formFields: {
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Issue with Browser Info",
          formFields: {
            description: "A bug",
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Issue with Console Logs",
          formFields: {
            description: "Error occurred",
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          formFields: {
            title: "Title from Form Fields",
            description: "Some description",
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
        'Content-Disposition: form-data; name="formFields"',
        "",
        '{"description":"Bug with screenshot"}',
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
        'Content-Disposition: form-data; name="formFields"',
        "",
        '{"description":"Bug"}',
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
    beforeEach(() => {
      // Mock config with project storage
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.withProject),
          encoding: "base64",
        },
      });
    });

    it("adds draft issue to project when storage type is project", async () => {
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Project Draft Issue",
          formFields: {
            description: "This goes to a project",
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
      // Mock project not found for both org and user
      mockOctokit.graphql.mockRejectedValue(new Error("Project not found"));

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Project Issue",
          formFields: {
            description: "Test",
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

  describe("feedback submission", () => {
    beforeEach(() => {
      // Mock config with feedback project
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.withFeedbackProject),
          encoding: "base64",
        },
      });
    });

    it("adds feedback to project with rating field", async () => {
      // Mock finding the project (first call in the feedback handling)
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_feedback123" } },
      });

      // Mock finding the project again (inside addToProject)
      mockOctokit.graphql.mockResolvedValueOnce({
        organization: { projectV2: { id: "PVT_feedback123" } },
      });

      // Mock adding draft to project
      mockOctokit.graphql.mockResolvedValueOnce({
        addProjectV2DraftIssue: {
          projectItem: { id: "PVTI_feedback_item123" },
        },
      });

      // Mock finding project fields
      mockOctokit.graphql.mockResolvedValueOnce({
        node: {
          fields: {
            nodes: [
              {
                id: "FIELD_rating",
                name: "Rating",
                options: [
                  { id: "OPT_1", name: "⭐" },
                  { id: "OPT_2", name: "⭐⭐" },
                  { id: "OPT_3", name: "⭐⭐⭐" },
                  { id: "OPT_4", name: "⭐⭐⭐⭐" },
                  { id: "OPT_5", name: "⭐⭐⭐⭐⭐" },
                ],
              },
            ],
          },
        },
      });

      // Mock updating field
      mockOctokit.graphql.mockResolvedValueOnce({
        updateProjectV2ItemFieldValue: {
          projectV2Item: { id: "PVTI_feedback_item123" },
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "User Feedback",
          rating: 4,
          submissionType: "feedback",
          formFields: {
            comment: "Love the product!",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.projectAdded).toBe(true);
    });

    it("creates issue as fallback when no feedback project configured", async () => {
      // Mock config without feedback project
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.minimal),
          encoding: "base64",
        },
      });

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: {
          number: 52,
          html_url: "https://github.com/testowner/testrepo/issues/52",
          node_id: "I_abc132",
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Feedback without Project",
          submissionType: "feedback",
          formFields: {
            comment: "Good stuff",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.issueNumber).toBe(52);

      // Should use "feedback" label
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ["feedback"],
        }),
      );
    });
  });

  describe("error handling", () => {
    it("returns 400 for missing required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          installationId: 123,
          owner: "testowner",
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          formFields: {
            description: "No title provided",
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "This will fail",
          formFields: {
            description: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Submission Failed");
      expect(body.message).toContain("GitHub API error");
    });

    it("returns descriptive error message when GitHub auth fails", async () => {
      mockOctokit.rest.issues.create.mockRejectedValue(
        new Error("Bad credentials"),
      );

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Auth will fail",
          formFields: {
            description: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Submission Failed");
      expect(body.message).toContain("Bad credentials");
    });

    it("returns descriptive error when repo not found", async () => {
      mockOctokit.rest.issues.create.mockRejectedValue(new Error("Not Found"));

      const response = await app.inject({
        method: "POST",
        url: "/submit",
        payload: {
          installationId: 123,
          owner: "testowner",
          repo: "nonexistent",
          title: "To missing repo",
          formFields: {
            description: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Submission Failed");
      expect(body.message).toContain("Not Found");
    });
  });

  describe("both storage type (issue + project)", () => {
    beforeEach(() => {
      // Mock config with 'both' storage type
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.full),
          encoding: "base64",
        },
      });
    });

    it("creates issue and adds to project when storage type is both", async () => {
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
          installationId: 123,
          owner: "testowner",
          repo: "testrepo",
          title: "Issue for Both",
          formFields: {
            description: "Goes to issue and project",
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

  describe("user token for projects", () => {
    beforeEach(() => {
      // Mock config with project storage
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.withProject),
          encoding: "base64",
        },
      });
    });

    it("uses user token for user projects when available", async () => {
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
          installationId: 123,
          owner: "testuser",
          repo: "testrepo",
          title: "User Project Issue",
          formFields: {
            description: "Test",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.projectAdded).toBe(true);
    });
  });
});
