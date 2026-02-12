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

### Migration from legacy `storage` config

> The legacy `storage` key configuration has been **removed**. All routing is now handled using the `targets` array and tab-level `targets` references. To migrate, define each destination under the `targets` key and update your tabs to reference the appropriate target via `targets: [targetId]`. See `/default/wafir.yaml` for updated config patterns.

### Required Fields

```yaml
# Your GitHub App installation ID (required)
installationId: 12345678

targets:
  - id: default
    type: github/issues
    target: your-username/your-repo
    authRef: "YOUR_INSTALLATION_ID" # Replace with your installation ID
  - id: project
    type: github/project
    target: your-username/your-project-id
    authRef: "YOUR_INSTALLATION_ID"
```

### Example Tab Routing

```yaml
tabs:
  - id: feedback
    label: "Feedback"
    icon: thumbsup
    targets: [project]
    fields:
      - id: title
        type: input
        attributes:
          label: "Title"
          placeholder: "Enter a title"
        validations:
          required: true
      - id: rating
        type: rating
        attributes:
          label: "How satisfied are you with our website?"
        validations:
          required: true
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
