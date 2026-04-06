// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
// Service worker – handles all API calls on behalf of the injected widget
import yaml from "js-yaml";
import { getSettings } from "../shared/storage.js";
import type { BridgeRequest, BridgeResponse } from "../shared/types.js";
import { BRIDGE_MSG_TYPE, BRIDGE_RSP_TYPE } from "../shared/types.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImgBBResponse {
  data?: { url?: string; display_url?: string };
  success: boolean;
  status: number;
}

interface BlobField {
  __blob: true;
  data: string; // data-URL
  name: string;
  type: string;
}

// ─── Health check ─────────────────────────────────────────────────────────────

function handleHealth(): BridgeResponse["data"] {
  return { status: "ok", source: "wafir-chrome-extension" };
}

// ─── Config loading ───────────────────────────────────────────────────────────

async function handleConfig(
  params: Record<string, string>,
): Promise<{ status: number; data?: unknown; error?: string }> {
  const configUrl = params["configUrl"];
  if (!configUrl) {
    return { status: 400, error: "configUrl parameter is required" };
  }

  let url: URL;
  try {
    url = new URL(configUrl);
  } catch {
    return { status: 400, error: `Invalid configUrl: ${configUrl}` };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return {
      status: 400,
      error: "configUrl must use http:// or https://",
    };
  }

  let text: string;
  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "text/plain, application/json, application/x-yaml, text/yaml",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return {
        status: response.status,
        error: `Failed to fetch config: HTTP ${response.status}`,
      };
    }
    text = await response.text();
  } catch (err) {
    return { status: 502, error: `Could not reach config URL: ${err}` };
  }

  let config: unknown;
  try {
    const isYaml =
      configUrl.endsWith(".yaml") ||
      configUrl.endsWith(".yml");
    if (isYaml) {
      config = yaml.load(text);
    } else {
      try {
        config = JSON.parse(text);
      } catch {
        config = yaml.load(text); // YAML is a superset of JSON
      }
    }
  } catch (err) {
    return { status: 422, error: `Failed to parse config: ${err}` };
  }

  return { status: 200, data: config };
}

// ─── Template loading ─────────────────────────────────────────────────────────

async function handleTemplate(
  params: Record<string, string>,
): Promise<{ status: number; data?: unknown; error?: string }> {
  const templateUrl = params["templateUrl"];
  if (!templateUrl) {
    return { status: 400, error: "templateUrl parameter is required" };
  }

  let url: URL;
  try {
    url = new URL(templateUrl);
  } catch {
    return { status: 400, error: `Invalid templateUrl: ${templateUrl}` };
  }

  let text: string;
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "text/plain, application/x-yaml, text/yaml" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { status: response.status, error: `HTTP ${response.status}` };
    }
    text = await response.text();
  } catch (err) {
    return { status: 502, error: `Could not reach template URL: ${err}` };
  }

  let template: unknown;
  try {
    template = yaml.load(text);
  } catch (err) {
    return { status: 422, error: `Failed to parse template: ${err}` };
  }

  const t = template as Record<string, unknown>;
  if (!t?.["body"] || !Array.isArray(t["body"])) {
    return { status: 422, error: "Invalid template: missing body array" };
  }

  return {
    status: 200,
    data: { body: t["body"], labels: t["labels"] ?? [] },
  };
}

// ─── ImgBB screenshot upload ──────────────────────────────────────────────────

async function uploadScreenshot(
  blobField: BlobField,
  apiKey: string,
): Promise<string | null> {
  // Extract base64 content (strip data:<mime>;base64, prefix)
  const base64 = blobField.data.includes(",")
    ? blobField.data.split(",")[1]
    : blobField.data;

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64);
  formData.append("expiration", "300"); // 5 minutes
  formData.append("name", "screenshot");

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("[Wafir Extension] ImgBB upload failed:", response.status);
      return null;
    }

    const result: ImgBBResponse = await response.json();
    return result.data?.display_url ?? result.data?.url ?? null;
  } catch (err) {
    console.error("[Wafir Extension] ImgBB upload error:", err);
    return null;
  }
}

// ─── Issue body formatter ─────────────────────────────────────────────────────

function buildIssueBody(
  formFields: Record<string, unknown>,
  fieldOrder: string[],
  fieldLabels: Record<string, string>,
  screenshotUrl?: string | null,
): string {
  const lines: string[] = [];

  for (const fieldId of fieldOrder) {
    const label = fieldLabels[fieldId] ?? fieldId;
    const value = formFields[fieldId];

    if (value === undefined || value === null || value === "") continue;

    // Skip internal screenshot/browserInfo fields – handled separately
    if (fieldId === "screenshot" || fieldId === "browser-info" || fieldId === "console-logs") {
      continue;
    }

    lines.push(`### ${label}`);
    if (typeof value === "object") {
      lines.push("```json", JSON.stringify(value, null, 2), "```");
    } else {
      lines.push(String(value));
    }
    lines.push("");
  }

  // Browser info
  const browserInfo = formFields["browser-info"] as string | undefined;
  if (browserInfo) {
    lines.push("### Browser Info");
    lines.push("```", browserInfo, "```", "");
  }

  // Console logs
  const consoleLogs = formFields["console-logs"] as string | undefined;
  if (consoleLogs) {
    lines.push("### Console Logs");
    lines.push("```", consoleLogs, "```", "");
  }

  // Screenshot
  if (screenshotUrl) {
    lines.push(
      "### Screenshot",
      `![Screenshot](${screenshotUrl})`,
      "",
      `> ⚠️ This screenshot expires in 5 minutes. ([view](${screenshotUrl}))`,
      "",
    );
  }

  lines.push(
    "---",
    "_Submitted via [Wafir Chrome Extension](https://github.com/BPS-Consulting/wafir)_",
  );

  return lines.join("\n");
}

// ─── GitHub issue submission ──────────────────────────────────────────────────

async function handleSubmit(
  body: Record<string, unknown>,
  githubToken: string,
  imgbbApiKey: string,
): Promise<{ status: number; data?: unknown; error?: string }> {
  const target = body["target"] as string | undefined;
  const targetType = body["targetType"] as string | undefined;
  const title = body["title"] as string | undefined;

  if (!target || !title) {
    return { status: 400, error: "target and title are required" };
  }

  if (targetType !== "github/issues") {
    return {
      status: 400,
      error: `Target type "${targetType}" is not supported by the extension (only github/issues is supported)`,
    };
  }

  const [owner, repo] = target.split("/");
  if (!owner || !repo) {
    return {
      status: 400,
      error: `Invalid target format: "${target}". Expected "owner/repo"`,
    };
  }

  if (!githubToken) {
    return {
      status: 401,
      error:
        "GitHub Personal Access Token is not configured. Open the extension options to set it up.",
    };
  }

  // Parse form data
  const formFields = (() => {
    try {
      return typeof body["formFields"] === "string"
        ? JSON.parse(body["formFields"])
        : (body["formFields"] as Record<string, unknown>) ?? {};
    } catch {
      return {};
    }
  })();

  const fieldOrder = (() => {
    try {
      return typeof body["fieldOrder"] === "string"
        ? JSON.parse(body["fieldOrder"])
        : (body["fieldOrder"] as string[]) ?? [];
    } catch {
      return [];
    }
  })();

  const fieldLabels = (() => {
    try {
      return typeof body["fieldLabels"] === "string"
        ? JSON.parse(body["fieldLabels"])
        : (body["fieldLabels"] as Record<string, string>) ?? {};
    } catch {
      return {};
    }
  })();

  const labels = (() => {
    try {
      return typeof body["labels"] === "string"
        ? JSON.parse(body["labels"])
        : (body["labels"] as string[]) ?? [];
    } catch {
      return [];
    }
  })();

  // Upload screenshot to ImgBB if present
  let screenshotUrl: string | null = null;
  const screenshotField = body["screenshot"];
  if (
    screenshotField &&
    typeof screenshotField === "object" &&
    (screenshotField as BlobField).__blob
  ) {
    if (imgbbApiKey) {
      screenshotUrl = await uploadScreenshot(
        screenshotField as BlobField,
        imgbbApiKey,
      );
    } else {
      console.warn(
        "[Wafir Extension] Screenshot captured but no ImgBB API key configured.",
      );
    }
  }

  const issueBody = buildIssueBody(
    formFields,
    fieldOrder,
    fieldLabels,
    screenshotUrl,
  );

  // Create GitHub issue via REST API
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body: issueBody,
        labels: labels.length > 0 ? labels : undefined,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg =
        (errorBody as { message?: string }).message ??
        `GitHub API error: HTTP ${response.status}`;
      return { status: response.status, error: msg };
    }

    const issue = (await response.json()) as { html_url: string; number: number };
    return {
      status: 201,
      data: { url: issue.html_url, number: issue.number },
    };
  } catch (err) {
    return {
      status: 502,
      error: `Failed to reach GitHub API: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Message dispatcher ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (r: Partial<BridgeResponse>) => void,
  ) => {
    const msg = message as BridgeRequest;
    if (msg.type !== BRIDGE_MSG_TYPE) return false;

    const { requestId, path, method, params = {}, body = {} } = msg;

    const respond = (result: { status: number; data?: unknown; error?: string }) => {
      sendResponse({
        type: BRIDGE_RSP_TYPE,
        requestId,
        status: result.status,
        data: result.data,
        error: result.error,
      } as BridgeResponse);
    };

    (async () => {
      const settings = await getSettings();

      // Route by path
      if (path === "/health" || path === "/health/") {
        respond({ status: 200, data: handleHealth() });
        return;
      }

      if (path.startsWith("/config/template")) {
        respond(await handleTemplate(params));
        return;
      }

      if (path.startsWith("/config/")) {
        respond(await handleConfig(params));
        return;
      }

      if (path.startsWith("/submit/") && method === "POST") {
        respond(await handleSubmit(body, settings.githubToken, settings.imgbbApiKey));
        return;
      }

      respond({ status: 404, error: `Unknown bridge path: ${path}` });
    })();

    return true; // keep message channel open for async response
  },
);
