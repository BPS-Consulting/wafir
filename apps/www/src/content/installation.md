# Installation

Get Wafir running in your application in minutes.

## 1. Install the GitHub App

The Wafir GitHub App authorizes the bridge to create issues and project items on your behalf.

[Install GitHub App](https://github.com/apps/wafir-web-feedback-widget)

> **Important:** If you collect feedback in a GitHub Project (recommended), install the app on your **account** rather than a specific repository. GitHub V2 Projects are account-level and not tied to individual repositories.

> **Note:** After installation, note your **Installation ID** from the URL (the number at the end). You'll need this to configure the widget.

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
    icon: 👍
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

| Attribute      | Type   | Required | Description                                        |
| -------------- | ------ | -------- | -------------------------------------------------- |
| `config-url`   | string | No       | URL to your wafir.yaml config file                 |
| `bridge-url`   | string | No       | Custom bridge server URL (default: hosted service) |
| `target-type`  | string | No       | `github/issues` or `github/project`                |
| `target`       | string | No       | Target identifier (e.g., `owner/repo`)             |
| `auth-ref`     | string | No       | GitHub App installation ID for authentication      |
| `position`     | string | No       | `bottom-right` (default) or `bottom-left`          |
| `modal-title`  | string | No       | Custom title for the feedback modal                |
| `tooltip-text` | string | No       | Tooltip text shown on trigger button hover         |

---

## Setting Up a GitHub Project

While Wafir can add issues directly to a repository issue list, we recommend creating a dedicated GitHub Project to manage feedback. This keeps user feedback separated from your internal development issue tracking. After review, any project item can be converted to an issue if development action is required.

> **Note:** Only GitHub Projects V2 are supported. Legacy V1 projects attached to a single repository are not supported.

### Create a Feedback Project

1. Go to **GitHub > Projects > New Project** and create a dedicated project (e.g., "MyApp Feedback")
2. Give your team access: **Project > Settings > Manage Access > Invite Collaborators**

### Configure the Project Workflow

1. Add a "Review" status: **Project > Settings > Custom Fields > Status > Add Option**
2. Set new items to start in Review: **Project > Workflows > Item added to project > Edit**

### Add Custom Fields

Add fields for any data you want to collect from users:

- **Rating** (Number): Wafir will render this as a star rating input and store the response as a number.
- **Priority** (Single select): Low, Medium, High
- **Category** (Single select): Bug, Feature Request, Question

> **Tip:** Typical customer satisfaction ratings use 1-5 stars (Very Unsatisfied → Very Satisfied). Customer Effort Scores also use 1-5 stars (Very Difficult → Very Easy).

### Connect the Widget to Your Project

Update your `wafir.yaml` to route feedback to your project:

```yaml
targets:
  - id: feedback-project
    type: github/project
    target: your-username/project-number
    authRef: "YOUR_INSTALLATION_ID"

forms:
  - id: feedback
    label: "Feedback"
    targets: [feedback-project]
    body:
      - id: title
        type: input
        attributes:
          label: "Title"
        validations:
          required: true
```

---

## Generate Config Helper

The Wafir Bridge provides an API to automatically generate a `wafir.yaml` configuration file based on your GitHub repository labels and project fields.

<div id="config-generator-placeholder"></div>

The API returns a ready-to-use YAML configuration with:

- **For `github/issues` targets:** A form with a dropdown populated from your repository labels
- **For `github/project` targets:** A form with fields mapped from your project's custom fields (dropdowns, dates, text inputs)

Save the response to `public/wafir.yaml` and customize as needed.

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

---

## Analyzing Your Feedback

Once feedback starts flowing into your GitHub Project, you can analyze it using tools like GitHub Project Insights, Screenful, or Excel (via export) to identify opportunities for improvement.
