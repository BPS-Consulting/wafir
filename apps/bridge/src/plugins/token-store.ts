import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    tokenStore: {
      setUserToken: (installationId: number, token: string) => void;
      getUserToken: (installationId: number) => string | undefined;
      deleteUserToken: (installationId: number) => boolean;
      hasUserToken: (installationId: number) => boolean;
    };
  }
}

const tokenStore = new Map<number, string>();

export default fp(async (fastify) => {
  fastify.decorate("tokenStore", {
    setUserToken: (installationId: number, token: string) => {
      tokenStore.set(installationId, token);
      fastify.log.info({ installationId }, "Stored user token");
    },
    getUserToken: (installationId: number) => {
      return tokenStore.get(installationId);
    },
    deleteUserToken: (installationId: number) => {
      const deleted = tokenStore.delete(installationId);
      if (deleted) {
        fastify.log.info({ installationId }, "Deleted user token");
      }
      return deleted;
    },
    hasUserToken: (installationId: number) => {
      return tokenStore.has(installationId);
    },
  });
});
