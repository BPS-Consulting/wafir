/**
 * Tests for loading and validating all example configurations
 * Ensures all configs in the /examples directory are valid
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { setupTestEnv } from "./helper.js";

// Import the config route
import configRoute from "../src/modules/config/routes.js";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

  beforeEach(async () => {
    setupTestEnv();

    app = Fastify({ logger: false });

    // Register the config route
    await app.register(configRoute, { prefix: "/config" });
    await app.ready();
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
        mockFetch.mockResolvedValue({
          ok: true,
          headers: new Headers({ "content-type": "text/yaml" }),
          text: () => Promise.resolve(content),
        });

        const response = await app.inject({
          method: "GET",
          url: "/config",
          query: {
            configUrl: `https://example.com/${name}/wafir.yaml`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);

        // All configs should have a title
        expect(body.title).toBeDefined();
        expect(typeof body.title).toBe("string");

        // All configs should have targets (even if just defaults)
        expect(body.targets).toBeDefined();
        expect(Array.isArray(body.targets)).toBe(true);
        if (body.targets.length > 0) {
          expect(["github/issues", "github/project"]).toContain(
            body.targets[0].type,
          );
        }
      },
    );
  });

  describe("minimal config validation", () => {
    it("loads minimal config with only required fields", async () => {
      const minimalConfig = exampleConfigs.find((c) => c.name === "minimal");
      expect(minimalConfig).toBeDefined();

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(minimalConfig!.content),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/minimal/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.title).toBe("Feedback");
      expect(body.targets).toHaveLength(1);
      expect(body.targets[0].type).toBe("github/issues");
      // No forms defined - should be absent (widget uses defaults)
      expect(body.forms).toBeUndefined();
    });
  });

  describe("full-featured config validation", () => {
    it("loads full-featured config with all options", async () => {
      const fullConfig = exampleConfigs.find((c) => c.name === "full-featured");
      expect(fullConfig).toBeDefined();

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(fullConfig!.content),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/full-featured/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Note: telemetry section is now deprecated in favor of autofill fields
      // The full-featured config no longer has a telemetry section

      // Check forms exist
      expect(body.forms).toBeDefined();
      expect(Array.isArray(body.forms)).toBe(true);
      expect(body.forms.length).toBeGreaterThan(0);

      // Check at least one form has the expected structure
      const firstForm = body.forms[0];
      expect(firstForm.id).toBeDefined();
      expect(firstForm.label).toBeDefined();
      expect(firstForm.body).toBeDefined();
      expect(Array.isArray(firstForm.body)).toBe(true);

      // Check that bug form has autofill fields
      const bugForm = body.forms.find((f: any) => f.id === "bug");
      if (bugForm) {
        const browserInfoField = bugForm.body?.find(
          (f: any) => f.attributes?.autofill === "browserInfo",
        );
        expect(browserInfoField).toBeDefined();
      }
    });
  });

  describe("project-based config validation", () => {
    it("loads project-based config with project target", async () => {
      const projectConfig = exampleConfigs.find(
        (c) => c.name === "project-based",
      );
      expect(projectConfig).toBeDefined();

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(projectConfig!.content),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/project-based/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      const projectTarget = body.targets.find(
        (t: any) => t.type === "github/project",
      );
      expect(projectTarget).toBeDefined();
      expect(projectTarget.target).toContain("/"); // Should have owner/projectNum format
    });
  });

  describe("feedback-focused config validation", () => {
    it("loads feedback-focused config with rating field", async () => {
      const feedbackConfig = exampleConfigs.find(
        (c) => c.name === "feedback-focused",
      );
      expect(feedbackConfig).toBeDefined();

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(feedbackConfig!.content),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/feedback-focused/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify feedback form with rating field
      expect(body.forms).toBeDefined();
      const feedbackForm = body.forms.find((t: any) => t.id === "feedback");
      expect(feedbackForm).toBeDefined();
      const ratingField = feedbackForm.body?.find(
        (f: any) => f.type === "rating",
      );
      expect(ratingField).toBeDefined();
    });
  });

  describe("privacy-focused config validation", () => {
    it("loads privacy-focused config with telemetry disabled", async () => {
      const privacyConfig = exampleConfigs.find(
        (c) => c.name === "privacy-focused",
      );
      expect(privacyConfig).toBeDefined();

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(privacyConfig!.content),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/privacy-focused/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Privacy-focused config has no telemetry section (uses opt-in autofill fields instead)
      // This means no automatic telemetry collection
      expect(body.telemetry).toBeUndefined();
    });
  });

  describe("field types in configs", () => {
    it("validates all field types in full-featured config", async () => {
      const fullConfig = exampleConfigs.find((c) => c.name === "full-featured");
      expect(fullConfig).toBeDefined();

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(fullConfig!.content),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/full-featured/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Collect all field types from all forms
      const fieldTypes = new Set<string>();
      for (const form of body.forms || []) {
        for (const field of form.body || []) {
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
