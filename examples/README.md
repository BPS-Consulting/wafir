# Wafir Configuration Examples

This directory contains example `wafir.yaml` configuration files for different use cases. Host one of these configurations anywhere (S3, Gist, CDN, your own server, etc.) and point your widget to it via the `configUrl` prop.

## Examples

| Example                                 | Description                  | Use When                            |
| --------------------------------------- | ---------------------------- | ----------------------------------- |
| [basic](./basic/)                       | Standard bug reporting setup | General purpose feedback collection |
| [minimal](./minimal/)                   | Simplest possible config     | Quick setup, minimal friction       |
| [full-featured](./full-featured/)       | All options demonstrated     | You want full control               |
| [privacy-focused](./privacy-focused/)   | No automatic data collection | User privacy is paramount           |
| [feature-requests](./feature-requests/) | Optimized for ideas          | Collecting enhancement requests     |
| [project-based](./project-based/)       | GitHub Projects integration  | Kanban-style feedback tracking      |

## Quick Start

1. **Install the GitHub App** on your repository
2. **Copy and customize** one of these examples - update `installationId`, `owner`, and `repo`
3. **Host the config file** anywhere accessible via URL (S3, Gist, CDN, etc.)
4. **Add the widget** to your application with the config URL:

```tsx
// React
import { WafirWidget } from "@wafir/react";

<WafirWidget configUrl="https://example.com/wafir.yaml" />;
```

```html
<!-- Vanilla HTML -->
<script type="module" src="https://unpkg.com/wafir"></script>
<wafir-widget configUrl="https://example.com/wafir.yaml"></wafir-widget>
```

## Configuration Reference

### Required Fields

```yaml
# Your GitHub App installation ID (required)
installationId: 12345678

storage:
  type: issue # Options: issue, project, both
  owner: your-username # Required: repository owner
  repo: your-repo # Required: repository name
  projectNumber: 1 # Required for project storage
```

### Optional: Dedicated Feedback Project

```yaml
# Dedicated project for feedback with rating field
feedbackProject:
  projectNumber: 1 # Your feedback project number
  owner: org-name # Project owner (defaults to repo owner)
  ratingField: "Rating" # Name of the Rating field in your project
```

### Automatic Data Collection

```yaml
telemetry:
  screenshot: true # Enable screenshot capture
  browserInfo: true # Collect URL, user agent, viewport
  consoleLog: false # Capture console messages
```

### Form Fields

Field types: `input`, `textarea`, `email`, `dropdown`, `checkboxes`, `rating`, `markdown`

```yaml
tabs:
  - id: feedback
    label: "Feedback"
    icon: thumbsup # Options: thumbsup, lightbulb, bug
    isFeedback: true # Uses rating field for project integration
    fields:
      - id: title
        type: input
        attributes:
          label: "Title"
          placeholder: "Enter a title"
        validations:
          required: true

      - id: priority
        type: dropdown
        attributes:
          label: "Priority"
          options: ["Low", "Medium", "High"]
        validations:
          required: false
```

## Tips

- Use **meaningful field names** - they appear in the GitHub issue body
- Enable **screenshots** for visual bugs
- Enable **browserInfo** for debugging browser-specific issues
- Keep forms **short** - users are more likely to submit brief forms
- Host your config on a **CDN** for best performance
