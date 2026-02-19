/**
 * Tests for the /generate endpoint
 * Tests generating sample wafir.yaml configs from GitHub targets
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { setupTestEnv, createMockOctokit, MockOctokit } from "./helper.js";

// Import the generate route
import generateRoute from "../src/modules/generate/routes.js";

describe("POST /generate", () => {
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

    // Register the generate route
    await app.register(generateRoute, { prefix: "/generate" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("returns 400 when installationId is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          targets: [{ type: "github/issues", target: "owner/repo" }],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when targets array is empty", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when target type is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [{ type: "invalid/type", target: "owner/repo" }],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain(
        "must be equal to one of the allowed values",
      );
    });
  });

  describe("github/issues target", () => {
    it("generates config with labels from repository", async () => {
      mockOctokit.rest.issues.listLabelsForRepo.mockResolvedValue({
        data: [
          { name: "bug", color: "d73a4a", description: "Something is broken" },
          { name: "enhancement", color: "a2eeef", description: "New feature" },
          { name: "question", color: "d876e3", description: "Needs info" },
        ],
      });

      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [{ type: "github/issues", target: "testowner/testrepo" }],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/yaml");

      const yaml = response.body;

      // Check generated YAML contains expected content
      expect(yaml).toContain("github/issues");
      expect(yaml).toContain("testowner/testrepo");
      expect(yaml).toContain("bug");
      expect(yaml).toContain("enhancement");
    });

    it("handles repository with no labels", async () => {
      mockOctokit.rest.issues.listLabelsForRepo.mockResolvedValue({
        data: [],
      });

      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [{ type: "github/issues", target: "testowner/testrepo" }],
        },
      });

      expect(response.statusCode).toBe(200);
      const yaml = response.body;
      // Should still generate a form without label dropdown
      expect(yaml).toContain("title");
      expect(yaml).toContain("description");
    });
  });

  describe("github/project target", () => {
    it("generates config with fields from project", async () => {
      // Mock finding org project
      mockOctokit.graphql
        .mockResolvedValueOnce({
          organization: {
            projectV2: { id: "PVT_kwDOtest123" },
          },
        })
        // Mock fetching project fields
        .mockResolvedValueOnce({
          node: {
            title: "Feedback Board",
            fields: {
              nodes: [
                { id: "F1", name: "Title", dataType: "TEXT" },
                {
                  id: "F2",
                  name: "Status",
                  dataType: "SINGLE_SELECT",
                  options: [
                    { id: "O1", name: "Todo" },
                    { id: "O2", name: "In Progress" },
                    { id: "O3", name: "Done" },
                  ],
                },
                {
                  id: "F3",
                  name: "Priority",
                  dataType: "SINGLE_SELECT",
                  options: [
                    { id: "P1", name: "Low" },
                    { id: "P2", name: "Medium" },
                    { id: "P3", name: "High" },
                  ],
                },
                { id: "F4", name: "Due Date", dataType: "DATE" },
                { id: "F5", name: "Notes", dataType: "TEXT" },
              ],
            },
          },
        });

      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [{ type: "github/project", target: "testowner/1" }],
        },
      });

      expect(response.statusCode).toBe(200);
      const yaml = response.body;

      // Check generated YAML
      expect(yaml).toContain("github/project");
      expect(yaml).toContain("testowner/1");
      expect(yaml).toContain("Status");
      expect(yaml).toContain("Priority");
    });

    it("tries user project when org project not found", async () => {
      mockOctokit.graphql
        // Org project lookup fails
        .mockRejectedValueOnce(new Error("Not found"))
        // User project lookup succeeds
        .mockResolvedValueOnce({
          user: {
            projectV2: { id: "PVT_kwDOuser123" },
          },
        })
        // Fetch fields
        .mockResolvedValueOnce({
          node: {
            title: "Personal Project",
            fields: {
              nodes: [{ id: "F1", name: "Title", dataType: "TEXT" }],
            },
          },
        });

      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [{ type: "github/project", target: "myuser/5" }],
        },
      });

      expect(response.statusCode).toBe(200);
      const yaml = response.body;
      expect(yaml).toContain("Personal Project");
    });

    it("handles project not found", async () => {
      mockOctokit.graphql
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"));

      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [{ type: "github/project", target: "testowner/999" }],
        },
      });

      // Even with errors, we return 200 with a default form
      expect(response.statusCode).toBe(200);
      const yaml = response.body;
      // Should still have basic structure
      expect(yaml).toContain("targets:");
      expect(yaml).toContain("forms:");
    });
  });

  describe("multiple targets", () => {
    it("generates config with both issues and project targets", async () => {
      // Mock labels
      mockOctokit.rest.issues.listLabelsForRepo.mockResolvedValue({
        data: [{ name: "bug", color: "d73a4a" }],
      });

      // Mock project lookup and fields
      mockOctokit.graphql
        .mockResolvedValueOnce({
          organization: {
            projectV2: { id: "PVT_kwDOtest123" },
          },
        })
        .mockResolvedValueOnce({
          node: {
            title: "Feedback",
            fields: {
              nodes: [
                {
                  id: "F1",
                  name: "Rating",
                  dataType: "SINGLE_SELECT",
                  options: [
                    { id: "R1", name: "⭐" },
                    { id: "R2", name: "⭐⭐" },
                  ],
                },
              ],
            },
          },
        });

      const response = await app.inject({
        method: "POST",
        url: "/generate",
        payload: {
          installationId: 123,
          targets: [
            { type: "github/issues", target: "testowner/testrepo" },
            { type: "github/project", target: "testowner/1" },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const yaml = response.body;

      expect(yaml).toContain("target-1");
      expect(yaml).toContain("target-2");
      expect(yaml).toContain("github/issues");
      expect(yaml).toContain("github/project");
    });
  });
});
