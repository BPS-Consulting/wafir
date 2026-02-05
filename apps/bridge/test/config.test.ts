/**
 * Tests for the /config endpoint
 * Tests fetching and processing wafir.yaml configurations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
  setupTestEnv,
  createMockOctokit,
  encodeYamlToBase64,
  sampleConfigs,
  MockOctokit,
} from "./helper.js";

// Import the config route
import configRoute from "../src/routes/config.js";

describe("GET /config", () => {
  let app: FastifyInstance;
  let mockOctokit: MockOctokit;

  beforeEach(async () => {
    setupTestEnv();
    mockOctokit = createMockOctokit();

    app = Fastify({ logger: false });

    // Register mock GitHub plugin
    await app.register(
      fp(async (fastify) => {
        (fastify as any).decorate(
          "getGitHubClient",
          vi.fn().mockResolvedValue(mockOctokit),
        );
      }),
    );

    // Register the config route
    await app.register(configRoute);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  describe("successful config fetching", () => {
    it("fetches and parses a minimal wafir.yaml config", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.minimal),
          encoding: "base64",
        },
      });

      // Mock user lookup (for issue types check)
      mockOctokit.rest.users.getByUsername.mockResolvedValue({
        data: { type: "User" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("Feedback");
      expect(body.storage.type).toBe("issue");
      expect(body.issueTypes).toEqual([]);
    });

    it("fetches config with project storage type", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.withProject),
          encoding: "base64",
        },
      });

      mockOctokit.rest.users.getByUsername.mockResolvedValue({
        data: { type: "User" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.storage.type).toBe("project");
      expect(body.storage.projectNumber).toBe(1);
    });

    it("fetches config with feedbackProject settings", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.withFeedbackProject),
          encoding: "base64",
        },
      });

      mockOctokit.rest.users.getByUsername.mockResolvedValue({
        data: { type: "User" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.feedbackProject.projectNumber).toBe(2);
      expect(body.feedbackProject.ratingField).toBe("Rating");
    });

    it("fetches full featured config with tabs and telemetry", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.full),
          encoding: "base64",
        },
      });

      mockOctokit.rest.users.getByUsername.mockResolvedValue({
        data: { type: "User" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("Full Config");
      expect(body.storage.type).toBe("both");
      expect(body.telemetry.screenshot).toBe(true);
      expect(body.telemetry.browserInfo).toBe(true);
      expect(body.telemetry.consoleLog).toBe(true);
      expect(body.tabs).toHaveLength(2);
      expect(body.tabs[0].id).toBe("issue");
      expect(body.tabs[1].id).toBe("feedback");
      expect(body.tabs[1].isFeedback).toBe(true);
    });

    it("includes organization issue types when owner is an org", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.minimal),
          encoding: "base64",
        },
      });

      mockOctokit.rest.users.getByUsername.mockResolvedValue({
        data: { type: "Organization" },
      });

      mockOctokit.request.mockResolvedValue({
        data: [
          { id: 1, name: "Bug", color: "red" },
          { id: 2, name: "Feature", color: "blue" },
        ],
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testorg",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.issueTypes).toHaveLength(2);
      expect(body.issueTypes[0]).toEqual({ id: 1, name: "Bug", color: "red" });
      expect(body.issueTypes[1]).toEqual({
        id: 2,
        name: "Feature",
        color: "blue",
      });
    });

    it("handles org without issue types support gracefully", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(sampleConfigs.minimal),
          encoding: "base64",
        },
      });

      mockOctokit.rest.users.getByUsername.mockResolvedValue({
        data: { type: "Organization" },
      });

      // Simulate 404 for issue types endpoint
      mockOctokit.request.mockRejectedValue({ status: 404 });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testorg",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.issueTypes).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("returns 404 when wafir.yaml does not exist", async () => {
      mockOctokit.rest.repos.getContent.mockRejectedValue({ status: 404 });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Config Not Found");
      expect(body.message).toBe("No .github/wafir.yaml found in repo");
    });

    it("returns 500 on GitHub API error", async () => {
      mockOctokit.rest.repos.getContent.mockRejectedValue({
        status: 500,
        message: "GitHub API error",
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Internal Server Error");
      expect(body.message).toBe("Failed to fetch config");
    });

    it("returns error when content is a directory not a file", async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          type: "dir",
          // No 'content' property for directories
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Internal Server Error");
    });
  });

  describe("query parameter validation", () => {
    it("requires installationId query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          owner: "testowner",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("requires owner query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          repo: "testrepo",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("requires repo query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          installationId: "123",
          owner: "testowner",
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
