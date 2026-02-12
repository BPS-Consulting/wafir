// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { wafirConfigSchema } from "../../shared/schemas/wafir-config.js";
import { ConfigService, ConfigQuery } from "./service.js";

const configRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  const configService = new ConfigService();

  fastify.get<{ Querystring: ConfigQuery }>(
    "/",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Get WAFIR Configuration (Deprecated)",
        description:
          "DEPRECATED: The widget now fetches config directly from a user-hosted URL. " +
          "This endpoint is kept for backward compatibility but will be removed in a future version. " +
          "Fetches and parses .github/wafir.yaml from the target repository.",
        deprecated: true,
        querystring: {
          type: "object",
          required: ["installationId", "owner", "repo"],
          properties: {
            installationId: { type: "number" },
            owner: { type: "string" },
            repo: { type: "string" },
          },
        },
        response: {
          200: wafirConfigSchema,
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { installationId, owner, repo } = request.query;

      try {
        const octokit = await fastify.getGitHubClient(installationId);

        // Fetch wafir.yaml
        const parsedConfig = await configService.fetchWafirConfig(
          octokit,
          owner,
          repo,
        );

        // Fetch issue types from organization (if available)
        const issueTypes = await configService.fetchIssueTypes(
          octokit,
          owner,
          request.log,
        );

        return {
          ...parsedConfig,
          issueTypes,
        };
      } catch (error: any) {
        request.log.error(error);
        if (error.status === 404) {
          return reply.code(404).send({
            error: "Config Not Found",
            message: "No .github/wafir.yaml found in repo",
          });
        }
        return reply.code(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch config",
        });
      }
    },
  );
};

export default configRoute;
