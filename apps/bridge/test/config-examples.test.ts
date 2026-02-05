/**
 * Tests for loading and validating all example configurations
 * Ensures all configs in the /examples directory are valid
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  setupTestEnv,
  createMockOctokit,
  encodeYamlToBase64,
  MockOctokit,
} from "./helper.js";

// Import the config route
import configRoute from "../src/domains/config/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const examplesDir = path.join(__dirname, "..", "..", "..", "examples");

// Get all example config files
function getExampleConfigs(): { name: string; content: string }[] {
  const examples: { name: string; content: string }[] = [];

  const dirs = fs.readdirSync(examplesDir);
  for (const dir of dirs) {
    const configPath = path.join(examplesDir, dir, "wafir.yaml");
    if (fs.existsSync(configPath)) {
      examples.push({
        name: dir,
        content: fs.readFileSync(configPath, "utf-8"),
      });
    }
  }

  return examples;
}

describe("Example Configurations", () => {
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

    // Default mock for user lookup
    mockOctokit.rest.users.getByUsername.mockResolvedValue({
      data: { type: "User" },
    });
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  const exampleConfigs = getExampleConfigs();

  describe("all example configs load successfully", () => {
    it.each(exampleConfigs)(
      'loads "$name" config successfully',
      async ({ name, content }) => {
        mockOctokit.rest.repos.getContent.mockResolvedValue({
          data: {
            content: encodeYamlToBase64(content),
            encoding: "base64",
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

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);

        // All configs should have a title
        expect(body.title).toBeDefined();
        expect(typeof body.title).toBe("string");

        // All configs should have storage (even if just defaults)
        if (body.storage) {
          expect(["issue", "project", "both"]).toContain(body.storage.type);
        }

        // issueTypes should always be present (possibly empty array)
        expect(body.issueTypes).toBeDefined();
        expect(Array.isArray(body.issueTypes)).toBe(true);
      },
    );
  });

  describe("minimal config validation", () => {
    it("loads minimal config with only required fields", async () => {
      const minimalConfig = exampleConfigs.find((c) => c.name === "minimal");
      expect(minimalConfig).toBeDefined();

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(minimalConfig!.content),
          encoding: "base64",
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

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.title).toBe("Feedback");
      expect(body.storage.type).toBe("issue");
      // No tabs defined - should be absent (widget uses defaults)
      expect(body.tabs).toBeUndefined();
    });
  });

  describe("full-featured config validation", () => {
    it("loads full-featured config with all options", async () => {
      const fullConfig = exampleConfigs.find((c) => c.name === "full-featured");
      expect(fullConfig).toBeDefined();

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(fullConfig!.content),
          encoding: "base64",
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

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Check telemetry settings
      expect(body.telemetry).toBeDefined();
      expect(body.telemetry.screenshot).toBe(true);
      expect(body.telemetry.browserInfo).toBe(true);
      expect(body.telemetry.consoleLog).toBe(true);

      // Check tabs exist
      expect(body.tabs).toBeDefined();
      expect(Array.isArray(body.tabs)).toBe(true);
      expect(body.tabs.length).toBeGreaterThan(0);

      // Check at least one tab has the expected structure
      const firstTab = body.tabs[0];
      expect(firstTab.id).toBeDefined();
      expect(firstTab.label).toBeDefined();
      expect(firstTab.fields).toBeDefined();
      expect(Array.isArray(firstTab.fields)).toBe(true);
    });
  });

  describe("project-based config validation", () => {
    it("loads project-based config with project storage", async () => {
      const projectConfig = exampleConfigs.find(
        (c) => c.name === "project-based",
      );
      expect(projectConfig).toBeDefined();

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(projectConfig!.content),
          encoding: "base64",
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

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.storage.type).toBe("project");
      expect(body.storage.projectNumber).toBeDefined();
      expect(typeof body.storage.projectNumber).toBe("number");
    });
  });

  describe("feedback-focused config validation", () => {
    it("loads feedback-focused config with feedbackProject", async () => {
      const feedbackConfig = exampleConfigs.find(
        (c) => c.name === "feedback-focused",
      );
      expect(feedbackConfig).toBeDefined();

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(feedbackConfig!.content),
          encoding: "base64",
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

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.feedbackProject).toBeDefined();
      expect(body.feedbackProject.projectNumber).toBeDefined();
      expect(body.feedbackProject.ratingField).toBeDefined();
    });
  });

  describe("privacy-focused config validation", () => {
    it("loads privacy-focused config with telemetry disabled", async () => {
      const privacyConfig = exampleConfigs.find(
        (c) => c.name === "privacy-focused",
      );
      expect(privacyConfig).toBeDefined();

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(privacyConfig!.content),
          encoding: "base64",
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

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Privacy-focused should have telemetry disabled
      expect(body.telemetry).toBeDefined();
      expect(body.telemetry.screenshot).toBe(false);
      expect(body.telemetry.browserInfo).toBe(false);
      expect(body.telemetry.consoleLog).toBe(false);
    });
  });

  describe("field types in configs", () => {
    it("validates all field types in full-featured config", async () => {
      const fullConfig = exampleConfigs.find((c) => c.name === "full-featured");
      expect(fullConfig).toBeDefined();

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: encodeYamlToBase64(fullConfig!.content),
          encoding: "base64",
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

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Collect all field types from all tabs
      const fieldTypes = new Set<string>();
      for (const tab of body.tabs || []) {
        for (const field of tab.fields || []) {
          fieldTypes.add(field.type);
        }
      }

      // Full-featured should have multiple field types
      const expectedTypes = [
        "markdown",
        "rating",
        "checkboxes",
        "textarea",
        "input",
        "dropdown",
        "email",
      ];
      for (const expectedType of expectedTypes) {
        expect(fieldTypes.has(expectedType)).toBe(true);
      }
    });
  });
});
