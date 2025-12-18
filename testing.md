# Local Testing Guide for WAFIR

Testing WAFIR locally requires a real GitHub App to interact with repositories. This guide walks you through the setup.

## 1. Create a GitHub App

1.  Go to your GitHub Settings > Developer settings > **GitHub Apps**.
2.  Click **New GitHub App**.
3.  **Name**: `Wafir Local Dev [Your Name]` (Must be unique).
4.  **Homepage URL**: `http://localhost:3000` (or any placeholder).
5.  **Webhook**: Uncheck "Active" for now (the bridge pulls config directly).
6.  **Permissions**:
    - **Repository permissions**:
      - `Issues`: Read & Write (To create/read feedback).
      - `Metadata`: Read-only (Mandatory).
      - `Contents`: Read-only (To read `.github/wafir.yaml`).
7.  Click **Create GitHub App**.

## 2. Configure the Bridge

1.  On your app page, find the **App ID**.
2.  Scroll down to **Private keys** and click **Generate a private key**. A `.pem` file will download.
3.  In the `bridge` directory, create a `.env` file from `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Fill in the `GITHUB_APP_ID`.
5.  Open the downloaded `.pem` file and copy its contents into `GITHUB_PRIVATE_KEY` in your `.env`.
    > [!TIP]
    > If you pass it as a single line, ensure newlines are escaped as `\n`.

## 3. Install the App on a Test Repo

1.  In your GitHub App settings, click **Install App** in the sidebar.
2.  Click **Install** next to your account.
3.  Select "Only select repositories" and pick a repository you want to use for testing.
4.  After installation, you will be redirected to a URL like `.../installations/12345678`.
5.  **Note this ID (`12345678`)**—this is your `installationId`.

## 4. Run the Bridge

```bash
cd bridge
pnpm install
pnpm dev
```

The bridge should now be running on `http://localhost:3000`.

## 5. Test with the Widget

### Option A: Using the built-in demo

Update `wafir/index.html` with your test details:

```html
<wafir-reporter
  installationId="YOUR_INSTALLATION_ID"
  owner="YOUR_GITHUB_USERNAME"
  repo="YOUR_REPO_NAME"
></wafir-reporter>
```

Then run:

```bash
cd wafir
pnpm install
pnpm dev
```

### Option B: Using the React Consumer

In `react-consumer/src/App.tsx`, import the widget and use it:

```tsx
import "wafir"; // Assuming it's linked or installed

function App() {
  return (
    <>
      <wafir-reporter installationId={12345678} owner="owner" repo="repo" />
      <h1>Wafir Test</h1>
    </>
  );
}
```

## 6. Dynamic Configuration

WAFIR fetches `.github/wafir.yaml` from your repo.
You can use the example file provided at [.github/wafir.yaml](file:///home/alvin/git/wafir/.github/wafir.yaml) as a starting point.
Push this file to your repository and the widget will update its fields automatically next time it's opened.

## 7. S3 Setup (Optional)

If you want to test screenshots, you'll need an S3 bucket and provide AWS credentials in `bridge/.env`.
The bridge currently uses these for generating upload URLs in `upload.ts`.
