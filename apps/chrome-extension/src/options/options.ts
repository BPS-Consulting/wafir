// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { getSettings, saveSettings } from "../shared/storage.js";
import type { ExtensionSettings } from "../shared/types.js";

// ── DOM references ─────────────────────────────────────────────────────────────

const form = document.getElementById("settings-form") as HTMLFormElement;
const statusBanner = document.getElementById("status-banner") as HTMLDivElement;
const testBtn = document.getElementById("test-btn") as HTMLButtonElement;
const testResult = document.getElementById("test-result") as HTMLDivElement;

const fields = {
  enabled: document.getElementById("enabled") as HTMLInputElement,
  githubToken: document.getElementById("githubToken") as HTMLInputElement,
  configUrl: document.getElementById("configUrl") as HTMLInputElement,
  imgbbApiKey: document.getElementById("imgbbApiKey") as HTMLInputElement,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function showBanner(
  el: HTMLDivElement,
  message: string,
  type: "success" | "error" | "info",
) {
  el.textContent = message;
  el.className = `banner banner--${type}`;
  el.removeAttribute("hidden");
  // Auto-hide success banners after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }
}

function hideBanner(el: HTMLDivElement) {
  el.classList.add("hidden");
}

// ── Load saved settings into the form ─────────────────────────────────────────

async function loadSettings() {
  const settings = await getSettings();
  fields.enabled.checked = settings.enabled;
  fields.githubToken.value = settings.githubToken;
  fields.configUrl.value = settings.configUrl;
  fields.imgbbApiKey.value = settings.imgbbApiKey;
}

// ── Save settings ──────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideBanner(statusBanner);

  const patch: Partial<ExtensionSettings> = {
    enabled: fields.enabled.checked,
    githubToken: fields.githubToken.value.trim(),
    configUrl: fields.configUrl.value.trim(),
    imgbbApiKey: fields.imgbbApiKey.value.trim(),
  };

  // Basic validation
  if (patch.configUrl && !/^https?:\/\//.test(patch.configUrl)) {
    showBanner(statusBanner, "Config URL must start with http:// or https://", "error");
    fields.configUrl.focus();
    return;
  }

  try {
    await saveSettings(patch);
    showBanner(statusBanner, "✓ Settings saved.", "success");
  } catch (err) {
    showBanner(
      statusBanner,
      `Failed to save settings: ${err instanceof Error ? err.message : String(err)}`,
      "error",
    );
  }
});

// ── Test connection ────────────────────────────────────────────────────────────

testBtn.addEventListener("click", async () => {
  hideBanner(testResult);

  const configUrl = fields.configUrl.value.trim();
  const githubToken = fields.githubToken.value.trim();

  if (!configUrl) {
    showBanner(testResult, "Please enter a Config File URL first.", "error");
    return;
  }

  if (!githubToken) {
    showBanner(testResult, "Please enter a GitHub Personal Access Token first.", "error");
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = "Testing…";

  const results: string[] = [];
  let allOk = true;

  // 1. Check config URL is reachable
  try {
    const response = await fetch(configUrl, { method: "HEAD" });
    if (response.ok) {
      results.push("✓ Config URL is reachable.");
    } else {
      results.push(`✗ Config URL returned HTTP ${response.status}.`);
      allOk = false;
    }
  } catch {
    results.push("✗ Config URL is not reachable (network error).");
    allOk = false;
  }

  // 2. Check GitHub token is valid
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (response.ok) {
      const user = (await response.json()) as { login?: string };
      results.push(`✓ GitHub token is valid (authenticated as ${user.login ?? "authenticated user"}).`);
    } else if (response.status === 401) {
      results.push("✗ GitHub token is invalid or expired.");
      allOk = false;
    } else {
      results.push(`✗ GitHub API returned HTTP ${response.status}.`);
      allOk = false;
    }
  } catch {
    results.push("✗ Could not reach GitHub API (network error).");
    allOk = false;
  }

  testBtn.disabled = false;
  testBtn.textContent = "Test Connection";

  showBanner(
    testResult,
    results.join("\n"),
    allOk ? "success" : "error",
  );
});

// ── Init ───────────────────────────────────────────────────────────────────────

loadSettings();
