import { FastifyPluginAsync } from "fastify";
import yaml from "js-yaml";

interface ConfigQuery {
  installationId: number;
  owner: string;
  repo: string;
}

const configRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Querystring: ConfigQuery }>(
    "/config",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Get WAFIR Configuration",
        description:
          "Fetches and parses .github/wafir.yaml from the target repository.",
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
          200: {
            type: "object",
            additionalProperties: true, // Returns the arbitrary JSON from the YAML
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
      const { installationId, owner, repo } = request.query;

      try {
        const octokit = await fastify.getGitHubClient(installationId);

        // Fetch wafir.yaml
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: ".github/wafir.yaml",
        });

        if (!("content" in data)) {
          throw new Error("File not found or is a directory");
        }

        // Decode Base64 and parse YAML
        const yamlContent = Buffer.from(data.content, "base64").toString(
          "utf-8"
        );
        const parsedConfig = yaml.load(yamlContent);

        return parsedConfig;
      } catch (error: any) {
        request.log.error(error);
        if (error.status === 404) {
          return reply
            .code(404)
            .send({
              error: "Config Not Found",
              message: "No .github/wafir.yaml found in repo",
            });
        }
        return reply
          .code(500)
          .send({
            error: "Internal Server Error",
            message: "Failed to fetch config",
          });
      }
    }
  );
};

export default configRoute;
