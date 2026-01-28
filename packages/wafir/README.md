# Wafir - Web App Feedback and Issue Reporter

[![npm version](https://img.shields.io/npm/v/wafir.svg)](https://www.npmjs.com/package/wafir)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight feedback and issue reporting widget that seamlessly connects user input to your GitHub-based development workflow. Wafir captures user feedback, screenshots, console logs, and essential browser telemetry to accelerate debugging.

**[Documentation](https://bps-consulting.github.io/wafir/)** | **[GitHub](https://github.com/BPS-Consulting/wafir)** | **[Report Issues](https://github.com/BPS-Consulting/wafir/issues)**

## ✨ Features

- 🎨 **Framework Agnostic** - Works with any web framework (React, Vue, Angular, vanilla JS)
- 🔌 **Easy Integration** - Simple web component that can be added to any HTML page
- 📸 **Screenshot Capture** - Automatic screenshot generation with element highlighting
- 🐛 **Console Log Collection** - Captures browser console logs for debugging
- 📊 **Browser Telemetry** - Collects essential browser and device information
- 🎯 **GitHub Integration** - Creates issues directly in your GitHub repository
- 🎨 **Highly Customizable** - Extensive CSS custom properties for theming
- 📝 **Configurable Forms** - Customize feedback forms to match your needs
- 🚀 **Lightweight** - Small bundle size (main widget ~24kB gzipped)

## 📦 Installation

```bash
npm install wafir
```

Or using pnpm:

```bash
pnpm add wafir
```

Or using yarn:

```bash
yarn add wafir
```

## 🚀 Quick Start

### Basic Usage

1. Import the widget in your application:

```javascript
// ES Module
import 'wafir';
```

2. Add the custom element to your HTML:

```html
<wafir-reporter
  installationId="12345678"
  owner="your-github-username"
  repo="your-repo-name"
  bridgeUrl="https://your-bridge-url.com"
></wafir-reporter>
```

### CDN Usage

You can also use Wafir via CDN without any build step:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your app content -->
  
  <!-- Load Wafir from CDN -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/wafir@latest/dist/wafir.js"></script>
  
  <!-- Add the Wafir widget -->
  <wafir-reporter
    installationId="12345678"
    owner="your-github-username"
    repo="your-repo-name"
  ></wafir-reporter>
</body>
</html>
```

## 🔧 Configuration

### Required Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `installationId` | `number` | GitHub App installation ID (get this from your GitHub App installation URL) |
| `owner` | `string` | GitHub repository owner (username or organization) |
| `repo` | `string` | GitHub repository name |

### Optional Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `bridgeUrl` | `string` | Wafir dev bridge | URL of your Wafir bridge service |
| `buttonText` | `string` | `""` | Custom text for the trigger button |
| `modalTitle` | `string` | `"Contact Us"` | Title displayed in the modal |
| `position` | `string` | `"bottom-right"` | Position of the trigger button (`"bottom-right"`, `"bottom-left"`, `"top-right"`, `"top-left"`) |
| `tooltipText` | `string` | `"Open Issue Reporter"` | Tooltip text for the trigger button |

### Example with All Options

```html
<wafir-reporter
  installationId="12345678"
  owner="your-org"
  repo="your-repo"
  bridgeUrl="https://your-bridge.example.com"
  buttonText="Feedback"
  modalTitle="Send Us Feedback"
  position="bottom-left"
  tooltipText="Click to send feedback"
></wafir-reporter>
```

## 🎨 Styling & Customization

Wafir uses Shadow DOM for encapsulation but exposes CSS custom properties for theming. You can customize the appearance by setting these variables on the `wafir-reporter` element:

### Basic Theme Example

```css
wafir-reporter {
  --wafir-primary-color: #6366f1;
  --wafir-primary-hover: #818cf8;
  --wafir-modal-bg: #ffffff;
  --wafir-text-color: #1f2937;
  --wafir-button-size: 56px;
  --wafir-modal-border-radius: 12px;
}
```

### Available CSS Custom Properties

#### Reporter Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--wafir-font-family` | System fonts | Font stack |
| `--wafir-font-size` | `14px` | Base font size |
| `--wafir-text-color` | `#111827` | Primary text color |
| `--wafir-text-secondary` | `#6b7280` | Muted text color |
| `--wafir-primary-color` | `#2563eb` | Brand color |
| `--wafir-primary-hover` | `#1d4ed8` | Hover state |
| `--wafir-border-color` | `#e5e7eb` | Border color |
| `--wafir-button-size` | `48px` | Trigger button size |
| `--wafir-button-border-radius` | `50%` | Button shape |
| `--wafir-button-offset` | `20px` | Edge distance |
| `--wafir-modal-bg` | `white` | Modal background |
| `--wafir-modal-border-radius` | `12px` | Modal corners |
| `--wafir-modal-max-width` | `800px` | Modal width |

See the full list of CSS variables in the [documentation](https://github.com/BPS-Consulting/wafir#css-customization).

## 🛠️ Advanced Usage

### Framework Integration

#### React

```jsx
import React from 'react';
import 'wafir';

function App() {
  return (
    <div>
      <h1>My React App</h1>
      <wafir-reporter
        installationId={12345678}
        owner="your-org"
        repo="your-repo"
      />
    </div>
  );
}
```

#### Vue

```vue
<template>
  <div>
    <h1>My Vue App</h1>
    <wafir-reporter
      :installationId="12345678"
      owner="your-org"
      repo="your-repo"
    />
  </div>
</template>

<script>
import 'wafir';

export default {
  name: 'App'
}
</script>
```

#### Angular

```typescript
// app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'wafir';

@Component({
  selector: 'app-root',
  template: `
    <h1>My Angular App</h1>
    <wafir-reporter
      [attr.installationId]="12345678"
      owner="your-org"
      repo="your-repo"
    ></wafir-reporter>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent { }
```

### TypeScript Support

Wafir includes TypeScript type definitions. Import types as needed:

```typescript
import type { 
  WafirReporterAttributes,
  FieldConfig,
  TabType,
  TabConfigs 
} from 'wafir';

// Use the types in your application
const config: Partial<TabConfigs> = {
  feedback: [
    {
      id: 'rating',
      label: 'How satisfied are you?',
      type: 'rating',
      required: true
    }
  ]
};
```

### Custom Form Configuration

You can customize the feedback forms by configuring them in your repository's `.github/wafir.yaml` file:

```yaml
issue:
  labels:
    - bug
    - needs-triage
  screenshot: true
  browserInfo: true
  consoleLog: true

fields:
  - name: priority
    label: "Priority"
    type: select
    options:
      - "Low"
      - "Medium"
      - "High"
```

See the [examples folder](https://github.com/BPS-Consulting/wafir/tree/main/examples) for more configuration templates.

## 🔐 Setting Up GitHub Integration

1. **Install the Wafir GitHub App**: Visit the [Wafir GitHub App](https://github.com/apps/wafir-web-feedback-widget) page and install it on your GitHub account or organization.

2. **Get Installation ID**: After installation, note the Installation ID from the URL (it's the number at the end of the installation URL).

3. **Configure Your Repository**: Set up a GitHub repository or project to receive feedback.

4. **Add Widget to Your App**: Add the `<wafir-reporter>` element with your configuration.

## 📚 API Reference

### Custom Element

```typescript
interface WafirReporterAttributes {
  buttonText?: string;
  modalTitle?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  tooltipText?: string;
  config?: Partial<TabConfigs>;
  installationId: number;
  owner: string;
  repo: string;
  bridgeUrl?: string;
}
```

### Exported Types

```typescript
type FieldType = "text" | "email" | "textarea" | "select" | "checkbox" | "screenshot" | "switch" | "rating";

interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  hidden?: boolean;
  defaultValue?: string;
  ratingLabels?: string[];
}

type TabType = "feedback" | "suggestion" | "issue";
type TabConfigs = Record<TabType, FieldConfig[]>;
```

## 🤝 Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/BPS-Consulting/wafir) to:

- Report bugs
- Suggest features
- Submit pull requests

See our [Contributing Guide](https://github.com/BPS-Consulting/wafir#contributing) for more information.

## 📄 License

MIT © [BPS Consulting](https://github.com/BPS-Consulting)

See [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Documentation](https://bps-consulting.github.io/wafir/)
- [GitHub Repository](https://github.com/BPS-Consulting/wafir)
- [Issues](https://github.com/BPS-Consulting/wafir/issues)
- [Quickstart Guide](https://github.com/BPS-Consulting/wafir/blob/main/QUICKSTART.md)

## 💡 Support

For questions, issues, or feature requests, please [open an issue](https://github.com/BPS-Consulting/wafir/issues) on GitHub.

---

Made with ❤️ by [BPS Consulting](https://github.com/BPS-Consulting)
