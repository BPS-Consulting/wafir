import fp from "fastify-plugin";
import cors, { FastifyCorsOptions } from "@fastify/cors";

export default fp<FastifyCorsOptions>(async (fastify, opts) => {
  fastify.register(cors, {
    origin: "*", // For the generic widget, we allow all origins. In production, you might restrict this.
    methods: ["GET", "POST", "OPTIONS"],
  });
});
