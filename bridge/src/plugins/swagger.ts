import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

// Use fp (fastify-plugin) for better encapsulation
export default fp(async (fastify, opts) => {
  // Only register Swagger/Swagger UI if running in a local development environment
  const isLocalDev = process.env.NODE_ENV === "development";

  if (!isLocalDev) {
    fastify.log.info("Swagger disabled (running in production mode)");
    return;
  }

  // 1. Register Swagger (for spec generation)
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Fastify Lambda API",
        description:
          "Serverless API documentation generated from route schemas",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local Development Server",
        },
      ],
    },
  });

  // 2. Register Swagger UI (for visual documentation)
  await fastify.register(swaggerUi, {
    routePrefix: "/docs", // Access the UI at http://localhost:3000/docs
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  fastify.addHook("onReady", () => {
    fastify.log.info(`Swagger UI is available at http://localhost:3000/docs`);
  });
});
