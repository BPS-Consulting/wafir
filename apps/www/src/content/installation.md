# Installation

Get Wafir running in your application in minutes.

## 1. Install the GitHub App

First, install the Wafir GitHub App on your repository. This allows Wafir to add items to the issue and project lists for your repository.

[Install GitHub App](https://github.com/apps/wafir-web-feedback-widget)

> **Note:** After installation, note your **Installation ID** from the URL. You'll need this to configure the widget.

## 2. Install the Widget Package

Install the Wafir widget package for your framework of choice:

```bash
npm install wafir
```

Or with pnpm:

```bash
pnpm add wafir
```

Or use a CDN:

```html
<script
  type="module"
  src="https://wafir-all.s3.us-east-2.amazonaws.com/wafir/latest/wafir.js"
></script>
```

## 3. Add the Widget to Your App

Import and add the widget component to your application:

```html
<!-- Add the widget -->
<wafir-widget
  target-type="string"   # github/issues | github/project
  target="string"        # e.g., owner/repo or owner/projectNum
  auth-ref="string"       # e.g., GitHub installation ID
></wafir-widget>
```

Or

```html
<wafir-widget config-url="/config.yaml" position="bottom-right"></wafir-widget>
```

## 4. Configure Your App

Place the `wafir.yaml` config file in your app's `public` directory (e.g. `public/wafir.yaml`). This file is loaded by the Wafir widget at runtime.

**Required top-level keys:**

- `installationId`: The numeric GitHub App installation ID
- `targets`: The array describing feedback routing destinations

Example:

```yaml
# public/wafir.yaml
targets:
  - id: default
    type: github/issues
    target: your-username/your-repo
    authRef: "YOUR_INSTALLATION_ID"

forms:
  - id: feedback
    label: "Feedback"
    icon: thumbsup
    body:
      - id: title
        type: input
        attributes:
          label: "Title"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Description"
        validations:
          required: true
```

> See the [Documentation](/documentation) for the full configuration reference and examples.

## Widget Attributes

| Attribute      | Type   | Required | Description                                            |
| -------------- | ------ | -------- | ------------------------------------------------------ |
| `config-url`   | string | No       | URL to your wafir.yaml config file                     |
| `bridge-url`   | string | No       | Custom bridge server URL (default: hosted service)     |
| `target-type`  | string | No       | `github/issues` or `github/project`                    |
| `target`       | string | No       | Target identifier (e.g., `owner/repo`)                 |
| `auth-ref`     | string | No       | GitHub App installation ID for authentication          |
| `position`     | string | No       | `bottom-right` (default) or `bottom-left`              |
| `modal-title`  | string | No       | Custom title for the feedback modal                    |
| `tooltip-text` | string | No       | Tooltip text shown on trigger button hover             |

---

## Self-Hosting the Bridge

For self-hosted deployments, set `bridge-url` to your server:

```html
<wafir-widget
  config-url="/wafir.yaml"
  bridge-url="https://your-bridge.example.com"
></wafir-widget>
```

> See the [Documentation](/documentation#connect-personal-projects) for personal project setup and advanced configuration.
