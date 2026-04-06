# Wafir Chrome Extension

A Chrome extension that injects the [Wafir](https://github.com/BPS-Consulting/wafir) feedback and issue-reporter widget into any web page. Allows testers to submit GitHub issues without needing the dev team to install the Wafir widget on their app or the Bridge as a GitHub App.

## Features

- **Inject anywhere** – The widget appears on every page you browse, so you can report issues in context.
- **No Bridge required** – Issues are submitted directly to GitHub using your Personal Access Token.
- **Screenshot support** – Screenshots are uploaded to ImgBB (expire after 5 minutes) and embedded in the GitHub issue.
- **Privacy warning** – The extension reminds you not to capture screenshots of sensitive information.
- **Simple configuration** – Set up once via the extension options page.

## Prerequisites

| Requirement | Notes |
|---|---|
| GitHub account | You must have a GitHub account with access to the target repository. |
| GitHub PAT | Create a [Personal Access Token](https://github.com/settings/personal-access-tokens/new) with the `repo` scope. |
| Wafir config file | A YAML or JSON configuration file hosted at a publicly accessible HTTPS URL. See the [examples](../../examples/) directory for templates. |
| ImgBB API key _(optional)_ | Required only if you want screenshots embedded in issues. Get one free at [api.imgbb.com](https://api.imgbb.com). |

## Installation (Developer Mode)

1. **Build the extension:**
   ```bash
   # From the repository root:
   pnpm --filter wafir build          # Build the Wafir widget first
   pnpm --filter chrome-extension build  # Then build the extension
   ```

2. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in the top-right corner)
   - Click **Load unpacked**
   - Select the `apps/chrome-extension/dist/` folder

3. **Configure the extension:**
   - Click the Wafir icon in the Chrome toolbar (or right-click → Options)
   - Fill in your **GitHub PAT**, **Config File URL**, and optionally your **ImgBB API key**
   - Click **Save Settings**
   - Use **Test Connection** to verify your credentials

## How It Works

```
User visits any page
       │
       ▼
Content script (injector.ts)
  • Reads settings from chrome.storage
  • Injects vendor/wafir.iife.js  ← registers <wafir-widget>
  • Injects content/main-world.js ← sets up fetch bridge + creates widget
       │
       ▼
Widget appears on the page
  • User fills out the feedback/bug form
  • Optionally takes a screenshot
       │
       ▼
On submit → fetch intercepted → postMessage → content script
       │
       ▼
Service worker (background)
  • Uploads screenshot to ImgBB (5-min expiry)
  • Creates GitHub issue via REST API using stored PAT
       │
       ▼
Success URL returned to widget
```

## Screenshot Privacy

> ⚠️ **Important:** Screenshots uploaded to ImgBB are publicly accessible for **5 minutes** after upload. Do **not** take screenshots of sensitive information such as passwords, personal data, API keys, or confidential documents.

The extension displays a persistent reminder near the widget button on every page.

## Config File Format

The config file is standard Wafir YAML/JSON format. Example:

```yaml
title: "Report an Issue"

targets:
  - id: default
    type: github/issues
    target: your-org/your-repo   # owner/repo
    authRef: "pat"               # arbitrary string; PAT is used automatically

forms:
  - id: bug
    label: "Bug Report"
    labels:
      - bug
    body:
      - id: description
        type: textarea
        attributes:
          label: "What went wrong?"
        validations:
          required: true
```

Host this file anywhere that's publicly accessible via HTTPS (e.g. a raw GitHub Gist).

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Build in watch mode
pnpm --filter chrome-extension run dev

# Type-check
pnpm --filter chrome-extension run check-types
```

After each change, reload the extension in `chrome://extensions` (click the refresh icon).
