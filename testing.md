# Wafir Local Testing Guide

This guide covers how to set up Wafir for local development and testing.

## Prerequisites

- Node.js 18+
- pnpm

## Setup

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env` in `apps/bridge`
   - Fill in your GitHub App credentials (ID, Private Key, Client ID, Client Secret)
   - Ensure `BRIDGE_URL` is set to `http://localhost:3000`

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Testing with the Widget

The `packages/wafir/index.html` file is serving a local instance of the widget for testing.

1. Open `http://localhost:5173` (or the port Vite assigns)
2. You should see the Wafir widget in the corner
3. Ensure your `packages/wafir/index.html` has the correct `installationId`, `owner`, and `repo` for a repository where the Wafir App is installed.

### Personal Projects Authentication

If you are testing **Personal Projects** (projects owned by a user, not an organization), you must perform an additional OAuth handshake:

1. Go to `http://localhost:4321/connect` (the `www` app)
2. Enter the Installation ID
3. Click "Authorize with GitHub"
4. After redirect, your local bridge will store the user token needed to access personal projects.

**Why?** GitHub App installation tokens do not have permission to modify personal projects (only organization projects). Accessing personal projects requires a user-level OAuth token.
