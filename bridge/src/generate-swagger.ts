import app from "./app.js";
import Fastify from "fastify";
import { writeFile } from "node:fs/promises";

process.env.NODE_ENV = "development";

const fastify = Fastify({
  logger: true,
});

await fastify.register(app);
await fastify.ready();

if (fastify.swagger === null || fastify.swagger === undefined) {
  throw new Error("@fastify/swagger plugin is not loaded");
}
await writeFile("swagger.json", JSON.stringify(fastify.swagger(), null, 2));
await fastify.close();
