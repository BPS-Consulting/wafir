import Fastify from "fastify";
import awsLambdaFastify from "@fastify/aws-lambda";
import { app } from "./app";

// 1. Instantiate the Fastify server
// The logger is set to false as the adapter handles logging to Lambda's console.
const fastify = Fastify({ logger: false });

// 2. Register the main application plugin
// The 'opts' object is empty, meaning 'isLocalDev' is undefined/false,
// which disables the conditional Swagger plugin.
fastify.register(app, {});

// 3. Create the proxy handler
// This converts AWS Lambda events into Fastify requests.
const proxy = awsLambdaFastify(fastify);

// The AWS Lambda handler function
// The 'handler' name is what you will configure in the AWS Lambda console.
export const handler = proxy;
