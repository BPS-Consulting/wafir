// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { GenerateService, GenerateTarget } from "./service.js";

interface GenerateBody {
  installationId: number;
  targets: GenerateTarget[];
}

const generateRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  const generateService = new GenerateService();

  fastify.post<{ Body: GenerateBody }>(
    "/",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Generate Sample Config",
        description:
          "Generates a sample wafir.yaml configuration file based on GitHub repository labels and project fields. " +
          "Provide your installation ID and an array of targets to analyze. Returns the config as plain text YAML.",
        body: {
          type: "object",
          required: ["installationId", "targets"],
          properties: {
            installationId: {
              type: "number",
              description: "Your GitHub App installation ID",
            },
            targets: {
              type: "array",
              description: "Array of targets to analyze",
              items: {
                type: "object",
                required: ["type", "target"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["github/issues", "github/project"],
                    description: "Target type",
                  },
                  target: {
                    type: "string",
                    description:
                      'Target identifier: "owner/repo" for issues, "owner/projectNumber" for projects',
                  },
                },
              },
              minItems: 1,
            },
          },
        },
        response: {
          200: {
            type: "string",
            description: "Generated wafir.yaml configuration content",
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
          500: {
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
      const { installationId, targets } = request.body;

      // Validate targets
      if (!targets || targets.length === 0) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "At least one target is required",
        });
      }

      for (const target of targets) {
        if (!target.type || !target.target) {
          return reply.code(400).send({
            error: "Bad Request",
            message: "Each target must have a type and target property",
          });
        }
        if (
          target.type !== "github/issues" &&
          target.type !== "github/project"
        ) {
          return reply.code(400).send({
            error: "Bad Request",
            message: `Invalid target type: ${target.type}. Must be "github/issues" or "github/project"`,
          });
        }
      }

      try {
        const octokit = await fastify.getGitHubClient(installationId);

        // Gather information from all targets
        const targetInfo = await generateService.gatherTargetInfo(
          octokit,
          targets,
          request.log,
        );

        // Generate the YAML config
        const yaml = generateService.generateConfig(
          installationId,
          targets,
          targetInfo,
        );

        // Return plain text YAML
        return reply.type("text/yaml").send(yaml);
      } catch (error: any) {
        request.log.error(error);

        if (error.status === 401 || error.status === 403) {
          return reply.code(403).send({
            error: "Authentication Failed",
            message:
              "Could not authenticate with GitHub. Check your installation ID.",
          });
        }

        return reply.code(500).send({
          error: "Internal Server Error",
          message: "Failed to generate config",
        });
      }
    },
  );
};

export default generateRoute;
