import { FastifyPluginAsync } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

interface UploadQuery {
  contentType: string; // e.g., 'image/png'
}

const uploadRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  fastify.get<{ Querystring: UploadQuery }>(
    "/upload-url",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Get SnapStore Upload URL",
        description:
          "Generates a temporary S3 Presigned URL. The Widget should PUT the image to this URL.",
        querystring: {
          type: "object",
          required: ["contentType"],
          properties: {
            contentType: {
              type: "string",
              description: "MIME type of the image (e.g., image/png)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              uploadUrl: { type: "string" },
              publicUrl: {
                type: "string",
                description: "The final URL of the image after upload",
              },
              expiresIn: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      if (!bucketName) {
        return reply
          .code(500)
          .send({
            error: "Configuration Error",
            message: "S3_BUCKET_NAME is not set",
          });
      }

      const { contentType } = request.query;
      const fileKey = `snapshots/${uuidv4()}`; // Generate unique filename

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        ContentType: contentType,
      });

      try {
        // Generate a URL valid for 5 minutes
        const uploadUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 300,
        });

        // Assuming standard S3 public access or CloudFront is configured for reading
        const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        return {
          uploadUrl,
          publicUrl,
          expiresIn: 300,
        };
      } catch (error) {
        request.log.error(error);
        return reply
          .code(500)
          .send({
            error: "S3 Error",
            message: "Failed to generate upload URL",
          });
      }
    }
  );
};

export default uploadRoute;
