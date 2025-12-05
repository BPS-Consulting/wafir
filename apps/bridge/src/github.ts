// src/github.ts
type GithubConfig = {
  token?: string; // For simple Personal Access Token
  appId?: string; // For GitHub App
  privateKey?: string; // For GitHub App
  installationId?: string; // For GitHub App
};

export class GithubClient {
  private config: GithubConfig;

  constructor(env: any) {
    this.config = {
      token: env.GITHUB_PAT,
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_PRIVATE_KEY,
      installationId: env.GITHUB_INSTALLATION_ID,
    };
  }

  // Helper to get a valid token
  private async getToken(): Promise<string> {
    // 1. Simple PAT mode (simplest for self-hosting)
    if (this.config.token) return this.config.token;

    // 2. GitHub App mode (Generates JWT -> Gets Access Token)
    // Note: In a real production app, you would import a JWT library here.
    // For brevity, we assume PAT for this example, or you can add 'jose' library.
    throw new Error("GitHub PAT is missing in environment variables.");
  }

  async createIssue(owner: string, repo: string, data: any) {
    const token = await this.getToken();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "WAFIR-Bridge",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GitHub Error: ${err}`);
    }

    return response.json();
  }

  async getConfig(owner: string, repo: string) {
    const token = await this.getToken();
    // Fetch .github/wafir.yaml
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/wafir.yaml`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "WAFIR-Bridge",
          Accept: "application/vnd.github.raw", // Get raw content
        },
      }
    );

    if (response.status === 404) return null;
    return response.text();
  }
}
