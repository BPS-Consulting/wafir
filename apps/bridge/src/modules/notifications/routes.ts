// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyPluginAsync } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface NotificationBody {
  [key: string]: unknown;
}

const notificationsRoute: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  fastify.post<{ Body: NotificationBody }>(
    "/",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Store Notification",
        description:
          "Accepts a JSON payload and stores it in S3 in the notifications folder.",
        body: {
          type: "object",
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              filename: { type: "string" },
              message: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      if (!bucketName) {
        return reply.code(500).send({
          error: "Configuration Error",
          message: "S3 bucket not configured",
        });
      }

      try {
        const payload = request.body;

        // Generate filename with N- prefix and timestamp
        const timestamp = Date.now();
        const filename = `N-${timestamp}.json`;
        const fileKey = `notifications/${filename}`;

        // Store in S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: JSON.stringify(payload, null, 2),
            ContentType: "application/json",
          }),
        );

        request.log.info({ fileKey }, "Notification stored successfully");

        return reply.send({
          success: true,
          filename,
          message: "Notification stored successfully",
        });
      } catch (error) {
        request.log.error({ error }, "Failed to store notification");
        return reply.code(500).send({
          error: "Storage Error",
          message:
            error instanceof Error ? error.message : "Failed to store notification",
        });
      }
    },
  );
};

export default notificationsRoute;
