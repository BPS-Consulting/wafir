import { FastifyPluginAsync } from "fastify";

const healthRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Health Check",
        description: "Returns the health status of the bridge service",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }
  );
};

export default healthRoute;
