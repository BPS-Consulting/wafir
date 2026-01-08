import { FastifyPluginAsync } from "fastify";

interface OAuthState {
  installationId: number;
  returnUrl?: string;
}

const authRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  fastify.get<{ Querystring: { installationId: string; returnUrl?: string } }>(
    "/auth/github",
    {
      schema: {
        tags: ["Auth"],
        summary: "Initiate GitHub OAuth",
        description: "Redirects to GitHub OAuth for user authorization",
        querystring: {
          type: "object",
          required: ["installationId"],
          properties: {
            installationId: { type: "string" },
            returnUrl: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!clientId) {
        return reply.code(500).send({ error: "OAuth not configured" });
      }

      const { installationId, returnUrl } = request.query;

      const state: OAuthState = {
        installationId: Number(installationId),
        returnUrl,
      };
      const encodedState = Buffer.from(JSON.stringify(state)).toString(
        "base64url"
      );

      const redirectUri = `${baseUrl}/auth/github/callback`;
      const scope = "read:user,project";

      const authUrl = new URL("https://github.com/login/oauth/authorize");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", scope);
      authUrl.searchParams.set("state", encodedState);

      return reply.redirect(authUrl.toString());
    }
  );

  fastify.get<{ Querystring: { code: string; state: string } }>(
    "/auth/github/callback",
    {
      schema: {
        tags: ["Auth"],
        summary: "GitHub OAuth Callback",
        description: "Handles OAuth callback from GitHub",
        querystring: {
          type: "object",
          required: ["code", "state"],
          properties: {
            code: { type: "string" },
            state: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!clientId || !clientSecret) {
        return reply.code(500).send({ error: "OAuth not configured" });
      }

      const { code, state } = request.query;

      let parsedState: OAuthState;
      try {
        parsedState = JSON.parse(
          Buffer.from(state, "base64url").toString("utf-8")
        );
      } catch {
        return reply.code(400).send({ error: "Invalid state parameter" });
      }

      try {
        const tokenResponse = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code,
            }),
          }
        );

        const tokenData = (await tokenResponse.json()) as {
          access_token?: string;
          error?: string;
          error_description?: string;
        };

        if (tokenData.error || !tokenData.access_token) {
          request.log.error(
            { error: tokenData.error },
            "OAuth token exchange failed"
          );
          const errorUrl = new URL(
            parsedState.returnUrl || "http://localhost:4321/connect"
          );
          errorUrl.searchParams.set("error", tokenData.error || "unknown");
          return reply.redirect(errorUrl.toString());
        }

        fastify.tokenStore.setUserToken(
          parsedState.installationId,
          tokenData.access_token
        );

        const successUrl = new URL(
          parsedState.returnUrl || "http://localhost:4321/connect"
        );
        successUrl.searchParams.set("success", "true");
        successUrl.searchParams.set(
          "installationId",
          String(parsedState.installationId)
        );
        return reply.redirect(successUrl.toString());
      } catch (error: any) {
        request.log.error({ error: error.message }, "OAuth callback failed");
        return reply.code(500).send({ error: "OAuth failed" });
      }
    }
  );

  fastify.get<{ Params: { installationId: string } }>(
    "/auth/status/:installationId",
    {
      schema: {
        tags: ["Auth"],
        summary: "Check Auth Status",
        description: "Check if user token exists for installation",
        params: {
          type: "object",
          required: ["installationId"],
          properties: {
            installationId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              connected: { type: "boolean" },
              installationId: { type: "number" },
            },
          },
        },
      },
    },
    async (request) => {
      const installationId = Number(request.params.installationId);
      return {
        connected: fastify.tokenStore.hasUserToken(installationId),
        installationId,
      };
    }
  );

  fastify.delete<{ Params: { installationId: string } }>(
    "/auth/:installationId",
    {
      schema: {
        tags: ["Auth"],
        summary: "Disconnect Auth",
        description: "Remove stored user token for installation",
        params: {
          type: "object",
          required: ["installationId"],
          properties: {
            installationId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const installationId = Number(request.params.installationId);
      const deleted = fastify.tokenStore.deleteUserToken(installationId);
      return reply.code(deleted ? 200 : 404).send({
        success: deleted,
        installationId,
      });
    }
  );
};

export default authRoute;
