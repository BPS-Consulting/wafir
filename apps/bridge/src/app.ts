// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import * as path from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync } from "fastify";
import { fileURLToPath } from "node:url";
import fp from "fastify-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type AppOptions = {
  // custom options
} & Partial<AutoloadPluginOptions>;

const options: AppOptions = {};

// 2. Wrap the app plugin in fp
const app: FastifyPluginAsync<AppOptions> = fp(
  async (fastify, opts): Promise<void> => {
    // Load shared plugins first
    void fastify.register(AutoLoad, {
      dir: path.join(__dirname, "shared", "plugins"),
      options: opts,
      forceESM: true,
    });

    // Load modules (routes.ts or index.ts files from each module)
    void fastify.register(AutoLoad, {
      dir: path.join(__dirname, "modules"),
      options: opts,
      forceESM: true,
      autoHooks: true,
      cascadeHooks: true,
    });
  },
);

export default app;
export { app, options };
