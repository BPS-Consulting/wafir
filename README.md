# Wafir - The Web App Feedback and Issue Reporter

Wafir is a lightweight feedback and issue reporting tool that seamlessly connects input from users and testers to your GitHub-based development workflow. It captures user input, screenshots, console logs, and essential browser telemetry to accelerate debugging. See details at https://bps-consulting.github.io/wafir/.

## What's in this Repo

This repository contains everything needed to build, use, and support Wafir. You don't need to clone the repo to use Wafir: simply get the widget code and add it to your web application as described in the [Quickstart Guide](QUICKSTART.md).

The repo includes source code for the following:

- **Wafir Widget** (packages/wafir): A web component built with Lit that you can embed in any web application to collect user feedback.
- **Bridge Service** (apps/bridge): A Fastify-based backend service that handles feedback submissions, file uploads, and GitHub integration. See the [wafir-infrastructure](https://github.com/bps-consulting/wafir-infrastructure) repo for deployment and infrastructure details.
- **Test Web Page** (packages/wafir/index.html): A simple HTML page to test the Wafir widget in isolation.
- **React Consumer** (internal/react-consumer): A sample React application demonstrating how to integrate the Wafir widget. {TODO: Update or remove if needed}
- **Framework Wrappers** (packages/react, packages/vue): Sample React and Vue wrappers demonstrating how to integrate the Wafir widget into popular frameworks.
- **Public Documentation Site** (apps/www): An Astro-based website for public documentation deployed on [GitHub Pages](https://bps-consulting.github.io/wafir/).
- **Configuration Examples** (examples/): Sample YAML files showing how to configure the Wafir widget.

## 🚀 Tech Stack

### Wafir (Widget)

<p align="left">
  <img src="https://img.shields.io/badge/Lit-324FFF?style=for-the-badge&logo=lit&logoColor=white" alt="Lit" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Nanostores-000000?style=for-the-badge&logo=nanostores&logoColor=white" alt="Nanostores" />
</p>

- **Lit**: Simple, fast Web Components.
- **Nanostores**: A tiny state manager for React, Preact, Vue, Svelte, and vanilla JS.
- **Modern Screenshot**: Accurate DOM-to-Canvas rendering for feedback context.
- **OpenAPI Fetch**: Type-safe API fetching.

### Bridge (Backend/API)

<p align="left">
  <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" alt="AWS S3" />
  <img src="https://img.shields.io/badge/Octokit-24292E?style=for-the-badge&logo=github&logoColor=white" alt="Octokit" />
</p>

- **Fastify**: Fast and low overhead web framework for Node.js.
- **AWS S3**: Secure storage for screenshots and assets.
- **Octokit**: Integration with GitHub for automated issue creation.
- **Swagger/OpenAPI**: Automated API documentation.

### Monorepo Tooling

<p align="left">
  <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

## 📂 Project Structure

- **`wafir/`**: The client-side widget built with Lit. It's designed to be embedded in any web application.
- **`bridge/`**: The backend server built with Fastify. It handles submissions, file uploads (to S3), and integrations (like GitHub).
- **`react-consumer/`**: A sample React application demonstrating how to integrate the Wafir widget.

## 🛠️ Installation

This project is a monorepo managed by **pnpm** and **Turborepo**.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/BPS-Consulting/wafir.git
    cd wafir
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

## 🏃‍♂️ Running Locally

To start the development environment for all packages (Widget, Bridge, and Consumer):

```bash
pnpm dev
```

This command runs `turbo run dev`, which spins up:

- The **Wafir Widget** in watch mode.
- The **Bridge API** server.
- The **React Consumer** app to test the integration.

## 🏗️ Building

To build all packages for production:

```bash
pnpm build
```

To build the browser version of the Wafir widget and copy it to the www site:

```bash
cd packages/wafir && pnpm run build:browser
cd apps/www && pnpm run build
```

## 🔧 Configuration

### Bridge Environment Variables

Create a `.env` file in the `bridge/` directory based on the usage requirements. You typically need:

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: For S3 access.
- `GITHUB_TOKEN`: For GitHub issue creation integration.

### Widget Configuration

The widget can be configured via attributes or JavaScript initialization. See the `wafir/` directory for specific implementation details.

### CSS Customization

Wafir uses Shadow DOM for isolation but exposes CSS custom properties for theming. Set these on the `wafir-widget` element:

#### Reporter Variables

| Variable                          | Default                       | Description         |
| --------------------------------- | ----------------------------- | ------------------- |
| `--wafir-font-family`             | System fonts                  | Font stack          |
| `--wafir-font-size`               | `14px`                        | Base font size      |
| `--wafir-text-color`              | `#111827`                     | Primary text color  |
| `--wafir-text-secondary`          | `#6b7280`                     | Muted text color    |
| `--wafir-primary-color`           | `#2563eb`                     | Brand color         |
| `--wafir-primary-hover`           | `#1d4ed8`                     | Hover state         |
| `--wafir-border-color`            | `#e5e7eb`                     | Border color        |
| `--wafir-button-size`             | `48px`                        | Trigger button size |
| `--wafir-button-border-radius`    | `50%`                         | Button shape        |
| `--wafir-button-offset`           | `20px`                        | Edge distance       |
| `--wafir-button-icon-size`        | `24px`                        | Icon size           |
| `--wafir-button-shadow`           | `0 4px 12px rgba(0,0,0,0.15)` | Button shadow       |
| `--wafir-button-shadow-hover`     | `0 6px 16px rgba(0,0,0,0.2)`  | Hover shadow        |
| `--wafir-tooltip-bg`              | `#1f2937`                     | Tooltip background  |
| `--wafir-backdrop-color`          | `rgba(0,0,0,0.5)`             | Modal backdrop      |
| `--wafir-modal-bg`                | `white`                       | Modal background    |
| `--wafir-modal-border-radius`     | `12px`                        | Modal corners       |
| `--wafir-modal-max-width`         | `800px`                       | Modal width         |
| `--wafir-modal-padding`           | `20px`                        | Modal spacing       |
| `--wafir-modal-shadow`            | `0 20px 60px rgba(0,0,0,0.3)` | Modal shadow        |
| `--wafir-modal-title-font-size`   | `18px`                        | Title size          |
| `--wafir-modal-title-font-weight` | `600`                         | Title weight        |
| `--wafir-modal-title-color`       | `--wafir-text-color`          | Title color         |

#### Form Variables

| Variable                        | Default       | Description      |
| ------------------------------- | ------------- | ---------------- |
| `--wafir-form-text-color`       | `#374151`     | Form text        |
| `--wafir-form-bg`               | `transparent` | Form background  |
| `--wafir-form-padding`          | `20px`        | Form padding     |
| `--wafir-form-border-color`     | `#d1d5db`     | Input borders    |
| `--wafir-form-border-radius`    | `6px`         | Input corners    |
| `--wafir-form-input-padding`    | `10px 12px`   | Input spacing    |
| `--wafir-form-input-color`      | `#111827`     | Input text       |
| `--wafir-form-input-bg`         | `#ffffff`     | Input background |
| `--wafir-form-primary-color`    | `#2563eb`     | Submit button    |
| `--wafir-form-primary-hover`    | `#1d4ed8`     | Submit hover     |
| `--wafir-form-disabled-color`   | `#9ca3af`     | Disabled state   |
| `--wafir-form-bg-secondary`     | `#f3f4f6`     | Secondary bg     |
| `--wafir-form-bg-tertiary`      | `#f9fafb`     | Tertiary bg      |
| `--wafir-form-text-secondary`   | `#6b7280`     | Secondary text   |
| `--wafir-form-telemetry-bg`     | `#f9fafb`     | Telemetry bg     |
| `--wafir-form-telemetry-border` | `#e5e7eb`     | Telemetry border |
| `--wafir-form-logs-bg`          | `#111827`     | Logs background  |
| `--wafir-form-logs-text`        | `#f3f4f6`     | Logs text        |
| `--wafir-form-log-warn`         | `#fde047`     | Warning color    |
| `--wafir-form-log-error`        | `#f87171`     | Error color      |

#### Highlighter Variables

| Variable                            | Default               | Description  |
| ----------------------------------- | --------------------- | ------------ |
| `--wafir-highlighter-overlay-bg`    | `rgba(0,0,0,0.1)`     | Overlay bg   |
| `--wafir-highlighter-primary-color` | `#2563eb`             | Border color |
| `--wafir-highlighter-highlight-bg`  | `rgba(37,99,235,0.1)` | Fill color   |

#### Example

```css
wafir-widget {
  --wafir-primary-color: #6366f1;
  --wafir-primary-hover: #818cf8;
  --wafir-modal-bg: #ffffff;
  --wafir-text-color: #1f2937;
  --wafir-form-border-radius: 8px;
}
```

## 🤝 Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## Credits

- This project uses [normalize.css](https://github.com/necolas/normalize.css) v8.0.1 by [Nicolas Gallagher](https://github.com/necolas), licensed under the [MIT License](https://github.com/necolas/normalize.css/blob/master/LICENSE).

## Distribution & Usage

### 📦 Using via NPM (Module, ESM)

Install:

```bash
npm install wafir
```

Import and use in your project:

```js
import { WafirWidget } from "wafir";
// Register/use wafir-widget as a custom element (see docs)
```

- For module consumers, import from `wafir`, styles from `wafir/styles/widget.css`, etc.

### 🌐 Using via CDN/IIFE (Browser Global)

Add to your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/wafir/dist/browser/wafir.browser.js"></script>
```

This exposes `Wafir` globally (e.g. `window.WafirWidget`).  
Include styles from the CDN:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/wafir/dist/browser/styles/wafir-widget.css"
/>
```

- Use `<wafir-widget></wafir-widget>` in your HTML as documented.

See full docs at [GitHub Pages](https://bps-consulting.github.io/wafir/).
