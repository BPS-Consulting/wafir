// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { AuthService } from "./service.js";

const authRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  const authService = new AuthService({
    clientId: clientId!,
    clientSecret: clientSecret!,
    baseUrl,
  });

  fastify.get<{ Querystring: { installationId: string; returnUrl?: string } }>(
    "/github",
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
      const authUrl = authService.generateAuthUrl(
        Number(installationId),
        returnUrl,
      );

      return reply.redirect(authUrl);
    },
  );

  fastify.get<{ Querystring: { code: string; state: string } }>(
    "/github/callback",
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

      let parsedState;
      try {
        parsedState = authService.parseState(state);
      } catch {
        return reply.code(400).send({ error: "Invalid state parameter" });
      }

      try {
        const tokenData = await authService.exchangeCodeForToken(code);

        if (tokenData.error || !tokenData.access_token) {
          request.log.error(
            {
              error: tokenData.error,
              description: tokenData.error_description,
            },
            "OAuth token exchange failed",
          );
          const errorCode =
            tokenData.error === "bad_verification_code"
              ? "session_expired"
              : tokenData.error || "unknown";
          const errorUrl = authService.buildErrorUrl(
            parsedState.returnUrl,
            errorCode,
          );
          return reply.redirect(errorUrl);
        }

        const formattedToken = authService.formatTokenData(tokenData);
        await fastify.tokenStore.setUserToken(
          parsedState.installationId,
          formattedToken,
        );

        const successUrl = authService.buildSuccessUrl(
          parsedState.returnUrl,
          parsedState.installationId,
        );
        return reply.redirect(successUrl);
      } catch (error: any) {
        request.log.error({ error: error.message }, "OAuth callback failed");
        return reply.code(500).send({ error: "OAuth failed" });
      }
    },
  );

  fastify.get<{ Params: { installationId: string } }>(
    "/status/:installationId",
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
        connected: await fastify.tokenStore.hasUserToken(installationId),
        installationId,
      };
    },
  );

  fastify.delete<{ Params: { installationId: string } }>(
    "/:installationId",
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
      const deleted = await fastify.tokenStore.deleteUserToken(installationId);
      return reply.code(deleted ? 200 : 404).send({
        success: deleted,
        installationId,
      });
    },
  );
};

export default authRoute;
