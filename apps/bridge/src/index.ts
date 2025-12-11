// src/index.ts
import { cors } from "hono/cors";
import { GithubClient } from "./github";
import { SnapStore } from "./s3";

// --- OpenAPI Integration Imports ---
import { z } from "zod";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
// --- Node.js Handler Import ---
import { serve } from "@hono/node-server";
// -----------------------------------

type Bindings = {
  GITHUB_PAT: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_BUCKET_NAME: string;
  ALLOWED_ORIGIN: string;
};

// Change Hono to OpenAPIHono
const app = new OpenAPIHono<{ Bindings: Bindings }>();

// 1. CORS Middleware (Critical for widget usage)
app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN || "*", // Lock this down in prod!
    allowMethods: ["POST", "GET", "OPTIONS"],
  });
  return corsMiddleware(c, next);
});

// --- ROUTE DEFINITIONS WITH OPENAPI SCHEMA ---

// 2. Health Check
const healthCheckRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ status: z.literal("WAFIR Bridge Operational") }),
        },
      },
      description: "Health Check",
    },
  },
});
app.openapi(healthCheckRoute, (c) =>
  c.json({ status: "WAFIR Bridge Operational" })
);

// 3. Get Config (Optional: If you want the widget to load config from GitHub)
const getConfigRoute = createRoute({
  method: "get",
  path: "/config/{owner}/{repo}",
  request: {
    params: z.object({
      owner: z.string().openapi({ example: "honojs" }),
      repo: z.string().openapi({ example: "hono" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ config: z.string().nullable() }).openapi({
            description:
              "Configuration content, typically YAML parsed to JSON.",
          }),
        },
      },
      description: "Successful retrieval of config.",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Error fetching config.",
    },
  },
});
app.openapi(getConfigRoute, async (c) => {
  const { owner, repo } = c.req.param();
  const gh = new GithubClient(c.env);

  try {
    const config = await gh.getConfig(owner, repo);
    // You might want to parse YAML to JSON here using 'js-yaml'
    return c.json({ config }, 200);
  } catch (e: any) {
    if (e.message) {
      console.error(e.message);
      return c.json({ error: e.message }, 500);
    }
    return c.json({ error: JSON.stringify(e) }, 500);
  }
});

// 4. Submit Feedback/Issue
const submitRoute = createRoute({
  method: "post",
  path: "/submit",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            owner: z.string().openapi({ example: "owner-org" }),
            repo: z.string().openapi({ example: "repo-name" }),
            data: z.string().openapi({
              description:
                "JSON string of form data (e.g., title, description, userAgent).",
              example: JSON.stringify({
                title: "Bug Report: Button not working",
                description: "The main login button is unresponsive.",
                url: "https://app.example.com",
              }),
            }),
            screenshot: z.instanceof(File).optional().openapi({
              description: "Optional screenshot file.",
              type: "string", // OpenAPI type for file upload
              format: "binary",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            issue_url: z.string().url(),
            issue_number: z.number(),
          }),
        },
      },
      description: "Issue submitted successfully.",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Missing required fields.",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false).optional(),
            error: z.string(),
          }),
        },
      },
      description: "Internal server error.",
    },
  },
});
app.openapi(submitRoute, async (c) => {
  try {
    const gh = new GithubClient(c.env);
    const s3 = new SnapStore(c.env);

    // Parse Multipart Form (Files + Data)
    const body = await c.req.parseBody();

    // Extract metadata
    const owner = body["owner"] as string;
    const repo = body["repo"] as string;
    const rawData = body["data"] as string; // JSON string of form data
    const screenshot = body["screenshot"] as File | undefined;

    if (!owner || !repo || !rawData) {
      return c.json(
        { error: "Missing required fields (owner, repo, data)" },
        400
      );
    }

    const formData = JSON.parse(rawData);

    // --- STEP 1: Upload Screenshot (if exists) ---
    let imageUrl: string | null = null;
    if (screenshot && screenshot instanceof File) {
      try {
        imageUrl = await s3.upload(screenshot);
      } catch (err) {
        console.error("Screenshot upload failed", err);
        // We continue without the image, but note the error
      }
    }

    // --- STEP 2: Format Markdown Body ---
    // This converts the JSON form data into a readable GitHub Issue
    let markdownBody = `### ${formData.title || "New Report"}\n\n`;

    if (formData.description) {
      markdownBody += `${formData.description}\n\n`;
    }

    // Add Image
    if (imageUrl) {
      markdownBody += `### Screenshot\n![User Screenshot](${imageUrl})\n\n`;
    }

    // Add Metadata Table
    markdownBody += `<details>\n<summary>Technical Details</summary>\n\n| Key | Value |\n|---|---|\n`;
    for (const [key, val] of Object.entries(formData)) {
      if (key !== "title" && key !== "description") {
        markdownBody += `| ${key} | ${val} |\n`;
      }
    }
    markdownBody += `\n</details>`;

    // --- STEP 3: Create GitHub Issue ---
    const issuePayload = {
      title: formData.title || "User Feedback",
      body: markdownBody,
      labels: ["wafir-report"], // Auto-label
    };

    const result = await gh.createIssue(owner, repo, issuePayload);

    return c.json(
      {
        success: true,
        issue_url: result.html_url,
        issue_number: result.number,
      },
      200
    );
  } catch (e: any) {
    console.error(e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// --- OPENAPI DOCS AND SWAGGER UI ---

// Expose the OpenAPI specification
app.get("/openapi", (c) => {
  return c.json(
    app.getOpenAPIDocument({
      openapi: "3.0.0",
      info: {
        title: "WAFIR Bridge API",
        version: "v1",
        description:
          "API for submitting user feedback and issues to GitHub (via Multipart Form Data).",
      },
      servers: [{ url: "/", description: "Current Environment" }],
    })
  );
});

// Add the interactive Swagger UI
app.get(
  "/swagger",
  swaggerUI({
    url: "/openapi",
  })
);

// Keep the default export for Worker/Edge environments
export default app;

// --- NODE.JS HANDLER ---
const PORT = 3000;

// This block uses the @hono/node-server adapter to run the Hono app in a Node.js environment.
serve(
  {
    fetch: app.fetch, // Hono's main handler
    port: PORT,
  },
  (info) => {
    console.log(`Server is running at http://localhost:${info.port}`);
    console.log(
      `Swagger UI available at http://localhost:${info.port}/swagger`
    );
  }
);
