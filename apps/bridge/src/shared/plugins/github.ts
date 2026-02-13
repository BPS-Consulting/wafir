import fp from "fastify-plugin";
import { App } from "@octokit/app";
import { Octokit } from "octokit";

// Declare the decoration in the Fastify type system
declare module "fastify" {
  interface FastifyInstance {
    getGitHubClient: (installationId: number) => Promise<Octokit>;
    getGitHubClientWithToken: (token: string) => Octokit;
  }
}

export default fp(async (fastify, opts) => {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    fastify.log.warn(
      "GITHUB_APP_ID or GITHUB_PRIVATE_KEY missing. Bridge will fail to connect.",
    );
    return;
  }

  // Initialize the GitHub App strategy
  const app = new App({
    appId: appId,
    privateKey: privateKey.replace(/\\n/g, "\n"), // Handle newlines if passed via single-line env var
    Octokit,
  });

  // Decorator: Exchanges the Installation ID for an authenticated Octokit client
  fastify.decorate("getGitHubClient", async (installationId: number) => {
    // This retrieves an installation access token
    const octokit = await app.getInstallationOctokit(installationId);
    return octokit;
  });

  // Decorator: Creates Octokit client from user's personal access token
  fastify.decorate("getGitHubClientWithToken", (token: string) => {
    return new Octokit({ auth: token });
  });
});
