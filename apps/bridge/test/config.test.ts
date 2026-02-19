/**
 * Tests for the /config endpoint
 * Tests fetching and parsing wafir configuration from URLs
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { setupTestEnv, sampleConfigs } from "./helper.js";

// Import the config route
import configRoute from "../src/modules/config/routes.js";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GET /config", () => {
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

  describe("successful config fetching", () => {
    it("fetches and parses a YAML config from URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(sampleConfigs.minimal),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("Feedback");
      expect(body.targets).toHaveLength(1);
      expect(body.targets[0].type).toBe("github/issues");

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/wafir.yaml",
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    it("fetches and parses a JSON config from URL", async () => {
      const jsonConfig = {
        title: "JSON Config",
        targets: [
          {
            id: "default",
            type: "github/issues",
            target: "owner/repo",
            authRef: "123",
          },
        ],
        forms: [
          {
            id: "feedback",
            label: "Feedback",
            body: [{ id: "message", type: "textarea" }],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        text: () => Promise.resolve(JSON.stringify(jsonConfig)),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/wafir.json",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("JSON Config");
      expect(body.targets).toHaveLength(1);
    });

    it("infers YAML format from URL extension", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(sampleConfigs.minimal),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/path/to/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("Feedback");
    });

    it("infers YAML format from .yml extension", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(sampleConfigs.minimal),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/config.yml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("Feedback");
    });

    it("fetches full featured config with forms", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(sampleConfigs.full),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.title).toBe("Full Config");
      expect(body.targets).toHaveLength(2);
      expect(body.targets.some((t: any) => t.type === "github/issues")).toBe(
        true,
      );
      expect(body.targets.some((t: any) => t.type === "github/project")).toBe(
        true,
      );
      expect(body.forms).toHaveLength(2);
      expect(body.forms[0].id).toBe("issue");
      expect(body.forms[1].id).toBe("feedback");
    });
  });

  describe("error handling", () => {
    it("returns 404 when config URL returns 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/notfound.yaml",
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Config Not Found");
    });

    it("returns 500 on fetch error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Internal Server Error");
    });

    it("returns 400 for invalid URL", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "not-a-valid-url",
        },
      });

      expect(response.statusCode).toBe(400);
      // Fastify schema validation rejects invalid URIs before handler runs
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Bad Request");
    });

    it("handles fetch network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {
          configUrl: "https://example.com/wafir.yaml",
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Internal Server Error");
    });
  });

  describe("query parameter validation", () => {
    it("requires configUrl query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config",
        query: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});

describe("GET /config/template", () => {
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

  const sampleTemplate = `
name: Bug Report
description: Report a bug
labels: ["bug", "triage"]
body:
  - type: input
    id: title
    attributes:
      label: Bug Title
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Description
    validations:
      required: true
`;

  describe("successful template fetching", () => {
    it("fetches and parses a GitHub issue form template", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(sampleTemplate),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config/template",
        query: {
          templateUrl: "https://example.com/template.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.body).toHaveLength(2);
      expect(body.body[0].type).toBe("input");
      expect(body.body[0].id).toBe("title");
      expect(body.labels).toEqual(["bug", "triage"]);
    });

    it("returns template without labels if not present", async () => {
      const templateNoLabels = `
name: Simple Template
body:
  - type: input
    id: title
`;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(templateNoLabels),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config/template",
        query: {
          templateUrl: "https://example.com/template.yaml",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.body).toHaveLength(1);
      expect(body.labels).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("returns 400 for invalid template format (missing body)", async () => {
      const invalidTemplate = `
name: Invalid Template
description: Has no body
`;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/yaml" }),
        text: () => Promise.resolve(invalidTemplate),
      });

      const response = await app.inject({
        method: "GET",
        url: "/config/template",
        query: {
          templateUrl: "https://example.com/invalid.yaml",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Invalid Template");
    });

    it("returns 404 when template URL returns 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const response = await app.inject({
        method: "GET",
        url: "/config/template",
        query: {
          templateUrl: "https://example.com/notfound.yaml",
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Template Not Found");
    });

    it("returns 400 for invalid URL", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config/template",
        query: {
          templateUrl: "not-a-valid-url",
        },
      });

      expect(response.statusCode).toBe(400);
      // Fastify schema validation rejects invalid URIs before handler runs
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Bad Request");
    });
  });

  describe("query parameter validation", () => {
    it("requires templateUrl query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/config/template",
        query: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
