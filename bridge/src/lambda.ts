import awsLambdaFastify from "@fastify/aws-lambda";
import Fastify from "fastify";
import app from "./app.js";

const fastify = Fastify({
  logger: true,
});

const proxy = awsLambdaFastify(fastify, { retainStage: true });

fastify.register(app);

export const handler = proxy;
