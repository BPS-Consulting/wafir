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
<wafir-widget
  installationId="YOUR_INSTALLATION_ID"
  owner="YOUR_GITHUB_USERNAME"
  repo="YOUR_REPO_NAME"
></wafir-widget>
```

Or use the **React Consumer** in `react-consumer/src/App.tsx`:

```tsx
import "wafir";

function App() {
  return (
    <>
      <wafir-widget installationId={12345678} owner="owner" repo="repo" />
      <h1>Wafir Test</h1>
    </>
  );
}
```

## 8. S3 Setup (Required for Screenshots)

GitHub rejects large base64-encoded images in issue bodies, so screenshots must be hosted externally. Configure an S3 bucket to enable screenshot uploads:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 9. Personal Projects OAuth (Optional)

To enable feedback submission to personal GitHub project boards, configure OAuth:

1. In your GitHub App settings, under **OAuth credentials**:
   - Generate a **Client secret**
   - Note your **Client ID**

2. Add to `bridge/.env`:

   ```env
   GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
   GITHUB_CLIENT_SECRET=your_client_secret
   BASE_URL=http://localhost:3000
   ```

3. Users can then authorize via the Connect page at `/connect`

> **Note:** Organization projects work without OAuth. This is only needed for personal (user-owned) projects.

---

## Self-Hosting the Bridge

You can self-host the Wafir bridge instead of using the hosted version. This gives you complete control over your data and deployment.

### Environment Variables Reference

| Variable                | Required | Description                                                             |
| ----------------------- | -------- | ----------------------------------------------------------------------- |
| `GITHUB_APP_ID`         | ✅       | Your GitHub App's ID                                                    |
| `GITHUB_PRIVATE_KEY`    | ✅       | Private key from your GitHub App (PEM format, newlines escaped as `\n`) |
| `GITHUB_CLIENT_ID`      | ❌       | OAuth Client ID (for personal project boards)                           |
| `GITHUB_CLIENT_SECRET`  | ❌       | OAuth Client Secret (for personal project boards)                       |
| `BASE_URL`              | ❌       | Public URL of your bridge (default: `http://localhost:3000`)            |
| `AWS_ACCESS_KEY_ID`     | ❌       | AWS credentials for S3 screenshot uploads                               |
| `AWS_SECRET_ACCESS_KEY` | ❌       | AWS credentials for S3 screenshot uploads                               |
| `AWS_REGION`            | ❌       | AWS region for S3 bucket                                                |
| `S3_BUCKET_NAME`        | ❌       | S3 bucket name for screenshot storage                                   |

### Docker Deployment

The bridge includes a Dockerfile and docker-compose configuration for easy deployment.

**Using Docker Compose:**

1. Create a `.env` file with your configuration:

   ```env
   GITHUB_APP_ID=123456
   GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

   # Optional
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=my-wafir-screenshots
   ```

2. Run the bridge:

   ```bash
   cd apps/bridge
   docker compose up -d
   ```

**Building Manually:**

```bash
cd apps/bridge
docker build -t wafir-bridge .
docker run -p 3000:3000 --env-file .env wafir-bridge
```

### Connecting Your Widget

Configure the widget to use your self-hosted bridge:

```html
<wafir-widget
  installationId="YOUR_INSTALLATION_ID"
  owner="YOUR_GITHUB_USERNAME"
  repo="YOUR_REPO_NAME"
  bridgeUrl="https://your-bridge.example.com"
></wafir-widget>
```

Or in React:

```tsx
<wafir-widget
  installationId={12345678}
  owner="owner"
  repo="repo"
  bridgeUrl="https://your-bridge.example.com"
/>
```

---

## Troubleshooting

- **Widget not loading config**: Ensure `.github/wafir.yaml` is pushed to your repository
- **Permission errors**: Verify your GitHub App has the required permissions
- **Installation ID not found**: Reinstall the app and check the URL for the ID
