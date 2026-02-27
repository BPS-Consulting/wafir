// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { wafirConfigSchema } from "../../shared/schemas/wafir-config.js";
import { ConfigService, ConfigQuery, TemplateQuery } from "./service.js";

const configRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  const configService = new ConfigService();

  fastify.get<{ Querystring: ConfigQuery }>(
    "/",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Get WAFIR Configuration",
        description:
          "Fetches and parses a wafir configuration file from a user-provided URL. " +
          "The URL should point to a raw YAML or JSON configuration file.",
        querystring: {
          type: "object",
          required: ["configUrl"],
          properties: {
            configUrl: {
              type: "string",
              format: "uri",
              description:
                "URL to the raw configuration file (YAML or JSON format)",
            },
          },
        },
        response: {
          200: wafirConfigSchema,
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
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
      const { configUrl } = request.query;

      try {
        const parsedConfig = await configService.fetchConfigFromUrl(configUrl);

        return parsedConfig;
      } catch (error: any) {
        request.log.error(error);

        if (error.message?.includes("Invalid URL")) {
          return reply.code(400).send({
            error: "Invalid URL",
            message: "The provided configUrl is not a valid URL",
          });
        }

        if (error.status === 404 || error.message?.includes("404")) {
          return reply.code(404).send({
            error: "Config Not Found",
            message: "No configuration file found at the provided URL",
          });
        }

        return reply.code(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch or parse config",
        });
      }
    },
  );

  fastify.get<{ Querystring: TemplateQuery }>(
    "/template",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Get GitHub Issue Form Template",
        description:
          "Fetches and parses a GitHub Issue Form template from a user-provided URL. " +
          "Returns the body (fields) and labels from the template.",
        querystring: {
          type: "object",
          required: ["templateUrl"],
          properties: {
            templateUrl: {
              type: "string",
              format: "uri",
              description: "URL to the raw template file (YAML format)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              body: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
                description: "Array of form fields from the template",
              },
              labels: {
                type: "array",
                items: { type: "string" },
                description: "Labels from the template",
              },
            },
            required: ["body"],
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
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
      const { templateUrl } = request.query;

      try {
        const template = await configService.fetchTemplateFromUrl(templateUrl);

        return template;
      } catch (error: any) {
        request.log.error(error);

        if (error.message?.includes("Invalid URL")) {
          return reply.code(400).send({
            error: "Invalid URL",
            message: "The provided templateUrl is not a valid URL",
          });
        }

        if (error.status === 404 || error.message?.includes("404")) {
          return reply.code(404).send({
            error: "Template Not Found",
            message: "No template file found at the provided URL",
          });
        }

        if (error.message?.includes("Invalid template format")) {
          return reply.code(400).send({
            error: "Invalid Template",
            message: error.message,
          });
        }

        return reply.code(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch or parse template",
        });
      }
    },
  );
};

export default configRoute;
