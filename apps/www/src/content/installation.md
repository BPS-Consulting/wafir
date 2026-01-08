# Installation

Get Wafir running in your application in minutes.

## 1. Install the GitHub App

First, install the Wafir GitHub App on your repository. This allows Wafir to create issues and read your configuration.

[Install GitHub App](https://github.com/apps/wafir)

> **Note:** After installation, note your **Installation ID** from the URL. You'll need this to configure the widget.

## 2. Install the Widget Package

Install the Wafir widget package for your framework of choice:

### React

```bash
npm install wafir @wafir/react
```

Or with pnpm:

```bash
pnpm add wafir @wafir/react
```

### Vue

```bash
npm install wafir @wafir/vue
```

Or with pnpm:

```bash
pnpm add wafir @wafir/vue
```

### Vanilla JS

```bash
npm install wafir
```

Or use a CDN:

```html
<script type="module" src="https://unpkg.com/wafir"></script>
```

## 3. Add the Widget to Your App

Import and add the widget component to your application:

### React

```jsx
import { WafirReporter } from "@wafir/react";

function App() {
  return (
    <div>
      {/* Your app content */}

      <WafirReporter
        installationId={12345}
        owner="your-username"
        repo="your-repo"
        position="bottom-right"
      />
    </div>
  );
}
```

### Vue

```vue
<script setup>
import { WafirReporter } from "@wafir/vue";
</script>

<template>
  <div>
    <!-- Your app content -->

    <WafirReporter
      :installation-id="12345"
      owner="your-username"
      repo="your-repo"
      position="bottom-right"
    />
  </div>
</template>
```

### Vanilla JS

```html
<!-- Add the script -->
<script type="module" src="https://unpkg.com/wafir"></script>

<!-- Add the widget -->
<wafir-reporter
  installationId="12345"
  owner="your-username"
  repo="your-repo"
  position="bottom-right"
></wafir-reporter>
```

## 4. Configure Your Repository

Create a `.github/wafir.yaml` file in your repository to configure the widget:

```yaml
# .github/wafir.yaml
storage:
  type: issue # Options: issue, project, both

feedback:
  title: "Submit Feedback"

issue:
  screenshot: true # Enable screenshot capture
  browserInfo: true # Collect browser details
  consoleLog: false # Capture console logs
  labels: ["feedback"]

fields:
  - name: title
    label: "Title"
    type: text
    required: true

  - name: description
    label: "Description"
    type: textarea
    required: true

  - name: type
    label: "Type"
    type: select
    options: ["Bug", "Feature Request", "Question"]
    required: true
```

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

### React

```jsx
<WafirReporter
  installationId={12345}
  owner="your-username"
  repo="your-repo"
  bridgeUrl="https://your-bridge.example.com"
/>
```

### Vue

```vue
<WafirReporter
  :installation-id="12345"
  owner="your-username"
  repo="your-repo"
  bridge-url="https://your-bridge.example.com"
/>
```

### Vanilla JS

```html
<wafir-reporter
  installationId="12345"
  owner="your-username"
  repo="your-repo"
  bridgeUrl="https://your-bridge.example.com"
></wafir-reporter>
```

> **Note:** If you don't specify a `bridgeUrl`, the widget will use the default hosted bridge service.
