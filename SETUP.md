# Wafir Setup Guide

Complete guide to set up Wafir from scratch for local development.

## Prerequisites

- **Node.js** (v18+)
- **pnpm** package manager
- A **GitHub account** with a test repository

## 1. Clone and Install

```bash
git clone https://github.com/BPS-Consulting/wafir.git
cd wafir
pnpm install
```

## 2. Create a GitHub App

1. Go to **GitHub Settings > Developer settings > GitHub Apps**
2. Click **New GitHub App**
3. Configure:
   - **Name**: `Wafir Local Dev [Your Name]` (doesn't really matter)
   - **Homepage URL**: `http://localhost:3000`
   - **Webhook**: Uncheck "Active"
4. Set **Repository permissions**:
   - `Issues`: Read & Write
   - `Metadata`: Read-only
   - `Contents`: Read-only
5. Click **Create GitHub App**

## 3. Configure the Bridge

1. Find your **App ID** on the app page
2. Generate a **Private key** (downloads a `.pem` file)
3. Create the environment file:
   ```bash
   cp bridge/.env.example bridge/.env
   ```
4. Fill in `bridge/.env`:
   ```env
   GITHUB_APP_ID=your_app_id
   GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   ```
   > **Tip:** Escape newlines as `\n` if passing as a single line.

## 4. Install the App on a Repository

1. In your GitHub App settings, click **Install App**
2. Select your account and choose a test repository
3. After installation, note the **Installation ID** from the URL (e.g., `.../installations/12345678`)

## 5. Add Wafir Configuration

Create `.github/wafir.yaml` in your test repository:

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

See [examples/](./examples) for more configuration templates.

## 6. Run the Development Environment

Start all packages:

```bash
pnpm dev
```

This runs:

- **Bridge** on `http://localhost:3000`
- **Wafir Widget** in watch mode
- **React Consumer** for testing

## 7. Configure the Widget

Update `wafir/index.html` with your test details:

```html
<wafir-reporter
  installationId="YOUR_INSTALLATION_ID"
  owner="YOUR_GITHUB_USERNAME"
  repo="YOUR_REPO_NAME"
></wafir-reporter>
```

Or use the **React Consumer** in `react-consumer/src/App.tsx`:

```tsx
import "wafir";

function App() {
  return (
    <>
      <wafir-reporter installationId={12345678} owner="owner" repo="repo" />
      <h1>Wafir Test</h1>
    </>
  );
}
```

## 8. S3 Setup (Optional)

For screenshot uploads, configure AWS credentials in `bridge/.env`:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Troubleshooting

- **Widget not loading config**: Ensure `.github/wafir.yaml` is pushed to your repository
- **Permission errors**: Verify your GitHub App has the required permissions
- **Installation ID not found**: Reinstall the app and check the URL for the ID
