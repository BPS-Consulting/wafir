import { FastifyPluginAsync } from "fastify";

interface SubmitBody {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}

const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.post<{ Body: SubmitBody }>(
    "/submit",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Submit Feedback/Issue",
        description: "Creates a new issue in the target GitHub repository.",
        body: {
          type: "object",
          required: ["installationId", "owner", "repo", "title", "body"],
          properties: {
            installationId: { type: "number" },
            owner: { type: "string" },
            repo: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            labels: { type: "array", items: { type: "string" } },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              issueUrl: { type: "string" },
              issueNumber: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { installationId, owner, repo, title, body, labels } = request.body;

      try {
        const octokit = await fastify.getGitHubClient(installationId);

        const issue = await octokit.rest.issues.create({
          owner,
          repo,
          title,
          body,
          labels: labels || ["wafir-feedback"],
        });

        reply.code(201).send({
          success: true,
          issueUrl: issue.data.html_url,
          issueNumber: issue.data.number,
        });
      } catch (error: any) {
        request.log.error(error);
        return reply
          .code(500)
          .send({ error: "Submission Failed", message: error.message });
      }
    }
  );
};

export default submitRoute;
