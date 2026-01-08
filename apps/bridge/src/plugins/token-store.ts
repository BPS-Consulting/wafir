import fp from "fastify-plugin";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

interface AccessTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
}

declare module "fastify" {
  interface FastifyInstance {
    tokenStore: {
      setUserToken: (
        installationId: number,
        data: AccessTokenData
      ) => Promise<void>;
      getUserToken: (installationId: number) => Promise<string | undefined>;
      deleteUserToken: (installationId: number) => Promise<boolean>;
      hasUserToken: (installationId: number) => Promise<boolean>;
    };
  }
}

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bucketName = process.env.S3_BUCKET_NAME;

function getTokenKey(installationId: number): string {
  return `tokens/${installationId}.json`;
}

async function refreshAccessToken(
  data: AccessTokenData,
  installationId: number,
  log: {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  }
): Promise<AccessTokenData | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    log.error("Cannot refresh token: OAuth not configured");
    return null;
  }

  const refreshTokenExpiry = new Date(data.refreshTokenExpiresAt);
  if (refreshTokenExpiry <= new Date()) {
    log.info(
      { installationId },
      "Refresh token expired, user must re-authenticate"
    );
    return null;
  }

  try {
    log.info({ installationId }, "Refreshing expired access token...");
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: data.refreshToken,
        }),
      }
    );

    const tokenData = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_token_expires_in?: number;
      error?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      log.error({ error: tokenData.error }, "Token refresh failed");
      return null;
    }

    const now = new Date();
    const newData: AccessTokenData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || data.refreshToken,
      expiresAt: new Date(
        now.getTime() + (tokenData.expires_in || 28800) * 1000
      ).toISOString(),
      refreshTokenExpiresAt: tokenData.refresh_token_expires_in
        ? new Date(
            now.getTime() + tokenData.refresh_token_expires_in * 1000
          ).toISOString()
        : data.refreshTokenExpiresAt,
    };

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: getTokenKey(installationId),
        Body: JSON.stringify(newData),
        ContentType: "application/json",
        ServerSideEncryption: "AES256",
      })
    );

    log.info({ installationId }, "Token refreshed and stored");
    return newData;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error({ error: message }, "Failed to refresh token");
    return null;
  }
}

export default fp(async (fastify) => {
  if (!bucketName) {
    fastify.log.warn("S3_BUCKET_NAME not set, token persistence disabled");
  }

  fastify.decorate("tokenStore", {
    setUserToken: async (
      installationId: number,
      data: AccessTokenData
    ): Promise<void> => {
      if (!bucketName) {
        fastify.log.warn("Cannot store token: S3_BUCKET_NAME not configured");
        return;
      }

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: getTokenKey(installationId),
          Body: JSON.stringify(data),
          ContentType: "application/json",
          ServerSideEncryption: "AES256",
        })
      );
      fastify.log.info({ installationId }, "Stored user token in S3");
    },

    getUserToken: async (
      installationId: number
    ): Promise<string | undefined> => {
      if (!bucketName) {
        return undefined;
      }

      try {
        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: getTokenKey(installationId),
          })
        );

        const body = await response.Body?.transformToString();
        if (!body) {
          return undefined;
        }

        const data: AccessTokenData = JSON.parse(body);
        const expiresAt = new Date(data.expiresAt);

        if (expiresAt <= new Date()) {
          const refreshedData = await refreshAccessToken(
            data,
            installationId,
            fastify.log
          );
          if (refreshedData) {
            return refreshedData.accessToken;
          }
          return undefined;
        }

        return data.accessToken;
      } catch (error: unknown) {
        const s3Error = error as { name?: string };
        if (s3Error.name === "NoSuchKey") {
          return undefined;
        }
        const message = error instanceof Error ? error.message : String(error);
        fastify.log.error(
          { error: message, installationId },
          "Failed to get user token"
        );
        return undefined;
      }
    },

    deleteUserToken: async (installationId: number): Promise<boolean> => {
      if (!bucketName) {
        return false;
      }

      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: getTokenKey(installationId),
          })
        );
        fastify.log.info({ installationId }, "Deleted user token from S3");
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        fastify.log.error(
          { error: message, installationId },
          "Failed to delete user token"
        );
        return false;
      }
    },

    hasUserToken: async (installationId: number): Promise<boolean> => {
      if (!bucketName) {
        return false;
      }

      try {
        await s3Client.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: getTokenKey(installationId),
          })
        );
        return true;
      } catch {
        return false;
      }
    },
  });
});
