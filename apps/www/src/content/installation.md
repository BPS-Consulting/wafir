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
installationId: 12345 # Your GitHub App installation ID
targets:
  - id: default
    type: github/issues
    target: your-username/your-repo
    authRef: "YOUR_INSTALLATION_ID"
  - id: project
    type: github/project
    target: your-username/your-project-id
    authRef: "YOUR_INSTALLATION_ID"
forms:
  - id: feedback
    label: "Feedback"
    icon: thumbsup
    targets: [project] # Routes feedback to 'project'
    fields:
      - id: title
        type: input
        attributes:
          label: "Title"
          placeholder: "Short summary"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Description"
          placeholder: "Describe the feedback"
        validations:
          required: true
      - id: rating
        type: rating
        attributes:
          label: "How satisfied are you with our website?"
        validations:
          required: true
  - id: issue
    label: "Issue"
    icon: bug
    targets: [default] # Routes feedback to 'default'
    fields:
      - id: title
        type: input
        attributes:
          label: "Issue title"
          placeholder: "Summarize the issue"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Description"
          placeholder: "Describe the issue"
        validations:
          required: true
      - id: type
        type: dropdown
        attributes:
          label: "Type"
          options: ["Bug", "Feature Request", "Question"]
        validations:
          required: true
```

> See `/examples/default/wafir.yaml` for up-to-date config templates using the new targets paradigm.

## Props Reference

| Prop             | Type   | Required | Description                                                             |
| ---------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `installationId` | number | Yes      | Your GitHub App installation ID                                         |
| `owner`          | string | Yes      | GitHub repository owner                                                 |
| `repo`           | string | Yes      | GitHub repository name                                                  |
| `bridgeUrl`      | string | No       | Custom bridge server URL (for self-hosted bridge)                       |
| `position`       | string | No       | Widget position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `modalTitle`     | string | No       | Custom title for the feedback modal                                     |
| `tooltipText`    | string | No       | Tooltip text for the trigger button                                     |

---

## Self-Hosting the Bridge

If you're self-hosting the Wafir bridge server, you can configure the widget to use your custom bridge URL:

### Vanilla JS

```html
<wafir-widget
  target-type="string"   # github/issues | github/project
  target="string"        # e.g., owner/repo or owner/projectNum
  auth-ref="string"       # e.g., GitHub installation ID
  bridgeUrl="https://your-bridge.example.com"
></wafir-widget>
```

> **Note:** If you don't specify a `bridgeUrl`, the widget will use the default hosted bridge service.
