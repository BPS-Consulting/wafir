# Wafir Configuration Examples

This directory contains example `wafir.yaml` configuration files for different use cases. Copy the appropriate template to your repository's `.github/wafir.yaml` file and customize it to your needs.

## Examples

| Example                                 | Description                  | Use When                            |
| --------------------------------------- | ---------------------------- | ----------------------------------- |
| [basic](./basic/)                       | Standard bug reporting setup | General purpose feedback collection |
| [minimal](./minimal/)                   | Simplest possible config     | Quick setup, minimal friction       |
| [full-featured](./full-featured/)       | All options demonstrated     | You want full control               |
| [privacy-focused](./privacy-focused/)   | No automatic data collection | User privacy is paramount           |
| [feature-requests](./feature-requests/) | Optimized for ideas          | Collecting enhancement requests     |

## Quick Start

1. **Install the GitHub App** on your repository
2. **Copy** one of these examples to `.github/wafir.yaml` in your repo
3. **Add the widget** to your application:

```tsx
// React
import { WafirReporter } from "@wafir/react";

<WafirReporter
  installationId={YOUR_INSTALLATION_ID}
  owner="your-username"
  repo="your-repo"
/>;
```

```html
<!-- Vanilla HTML -->
<script type="module" src="https://unpkg.com/wafir"></script>
<wafir-reporter
  installationId="YOUR_INSTALLATION_ID"
  owner="your-username"
  repo="your-repo"
></wafir-reporter>
```

## Configuration Reference

### Storage

```yaml
storage:
  type: issue # Options: issue, project, both
  owner: other-org # Optional: different repo owner
  repo: other-repo # Optional: different repo name
  projectId: 123 # Optional: GitHub Project ID
```

### Automatic Data Collection

```yaml
issue:
  screenshot: true # Enable screenshot capture
  browserInfo: true # Collect URL, user agent, viewport
  consoleLog: true # Capture console messages
  labels: ["bug"] # Labels for created issues
```

### Form Fields

Field types: `text`, `textarea`, `select`, `checkbox`

```yaml
fields:
  - name: title # Field identifier
    label: "Title" # Display label
    type: text # Field type
    required: true # Is field required?

  - name: priority
    label: "Priority"
    type: select
    options: ["Low", "Medium", "High"]
    required: false
```

## Tips

- Use **meaningful field names** - they appear in the GitHub issue body
- Enable **screenshots** for visual bugs
- Enable **browserInfo** for debugging browser-specific issues
- Keep forms **short** - users are more likely to submit brief forms
