# Wafir

Wafir is a powerful, lightweight feedback and bug reporting widget designed to bridge the gap between user feedback and your development workflow. It captures high-fidelity screenshots, collects console logs, and gathers essential browser telemetry to make debugging effortless.

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

## 🔧 Configuration

### Bridge Environment Variables

Create a `.env` file in the `bridge/` directory based on the usage requirements. You typically need:

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: For S3 access.
- `GITHUB_TOKEN`: For GitHub issue creation integration.

### Widget Configuration

The widget can be configured via attributes or JavaScript initialization. See the `wafir/` directory for specific implementation details.

## 🤝 Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request
