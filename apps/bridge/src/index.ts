// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { GithubClient } from "./github";
import { SnapStore } from "./s3";

type Bindings = {
  GITHUB_PAT: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_BUCKET_NAME: string;
  ALLOWED_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 1. CORS Middleware (Critical for widget usage)
app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN || "*", // Lock this down in prod!
    allowMethods: ["POST", "GET", "OPTIONS"],
  });
  return corsMiddleware(c, next);
});

// 2. Health Check
app.get("/", (c) => c.json({ status: "WAFIR Bridge Operational" }));

// 3. Get Config (Optional: If you want the widget to load config from GitHub)
app.get("/config/:owner/:repo", async (c) => {
  const { owner, repo } = c.req.param();
  const gh = new GithubClient(c.env);

  try {
    const config = await gh.getConfig(owner, repo);
    // You might want to parse YAML to JSON here using 'js-yaml'
    return c.json({ config });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// 4. Submit Feedback/Issue
app.post("/submit", async (c) => {
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

    return c.json({
      success: true,
      issue_url: result.html_url,
      issue_number: result.number,
    });
  } catch (e: any) {
    console.error(e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default app;
