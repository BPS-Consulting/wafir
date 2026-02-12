// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

export interface OAuthState {
  installationId: number;
  returnUrl?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

export interface TokenData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

export interface AccessTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
}

/**
 * Auth service - handles OAuth flow business logic
 */
export class AuthService {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Generates OAuth authorization URL with state parameter
   */
  generateAuthUrl(installationId: number, returnUrl?: string): string {
    const state: OAuthState = {
      installationId,
      returnUrl,
    };
    const encodedState = Buffer.from(JSON.stringify(state)).toString(
      "base64url",
    );

    const redirectUri = `${this.config.baseUrl}/auth/github/callback`;
    const scope = "read:user,project";

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", this.config.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", encodedState);

    return authUrl.toString();
  }

  /**
   * Parses and validates OAuth state parameter
   */
  parseState(state: string): OAuthState {
    try {
      return JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
    } catch {
      throw new Error("Invalid state parameter");
    }
  }

  /**
   * Exchanges OAuth code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TokenData> {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
        }),
      },
    );

    return (await response.json()) as TokenData;
  }

  /**
   * Converts token data to storage format
   */
  formatTokenData(tokenData: TokenData): AccessTokenData {
    if (!tokenData.access_token) {
      throw new Error("No access token in response");
    }

    const now = new Date();
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || "",
      expiresAt: new Date(
        now.getTime() + (tokenData.expires_in || 28800) * 1000,
      ).toISOString(),
      refreshTokenExpiresAt: tokenData.refresh_token_expires_in
        ? new Date(
            now.getTime() + tokenData.refresh_token_expires_in * 1000,
          ).toISOString()
        : new Date(now.getTime() + 15552000 * 1000).toISOString(),
    };
  }

  /**
   * Builds redirect URL with error parameters
   */
  buildErrorUrl(returnUrl: string | undefined, errorCode: string): string {
    const url = new URL(returnUrl || "http://localhost:4321/connect");
    url.searchParams.set("error", errorCode);
    return url.toString();
  }

  /**
   * Builds redirect URL with success parameters
   */
  buildSuccessUrl(
    returnUrl: string | undefined,
    installationId: number,
  ): string {
    const url = new URL(returnUrl || "http://localhost:4321/connect");
    url.searchParams.set("success", "true");
    url.searchParams.set("installationId", String(installationId));
    return url.toString();
  }
}
