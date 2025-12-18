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
    void fastify.register(AutoLoad, {
      dir: path.join(__dirname, "plugins"),
      options: opts,
      forceESM: true,
    });

    void fastify.register(AutoLoad, {
      dir: path.join(__dirname, "routes"),
      options: opts,
      forceESM: true,
    });
  }
);

export default app;
export { app, options };
