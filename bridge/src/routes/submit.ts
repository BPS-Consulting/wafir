import { FastifyPluginAsync } from "fastify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

interface SubmitBody {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}

const submitRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucketName = process.env.S3_BUCKET_NAME;

  fastify.post(
    "/submit",
    {
      schema: {
        tags: ["WAFIR"],
        summary: "Submit Feedback/Issue",
        description:
          "Creates a new issue in the target GitHub repository. Supports multipart/form-data for screenshots, which are uploaded to SnapStore (S3).",
      },
    },
    async (request, reply) => {
      let installationId: number | undefined;
      let owner: string | undefined;
      let repo: string | undefined;
      let title: string | undefined;
      let body: string | undefined;
      let labels: string[] | undefined;
      let screenshotBuffer: Buffer | undefined;
      let screenshotMime: string | undefined;

      if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === "file") {
            if (part.fieldname === "screenshot") {
              screenshotBuffer = await part.toBuffer();
              screenshotMime = part.mimetype;
            }
          } else {
            switch (part.fieldname) {
              case "installationId":
                installationId = Number(part.value);
                break;
              case "owner":
                owner = String(part.value);
                break;
              case "repo":
                repo = String(part.value);
                break;
              case "title":
                title = String(part.value);
                break;
              case "body":
                body = String(part.value);
                break;
              case "labels":
                try {
                  labels = JSON.parse(String(part.value));
                } catch {
                  labels = String(part.value)
                    .split(",")
                    .map((l) => l.trim());
                }
                break;
            }
          }
        }
      } else {
        const data = request.body as SubmitBody;
        installationId = data.installationId;
        owner = data.owner;
        repo = data.repo;
        title = data.title;
        body = data.body;
        labels = data.labels;
      }

      if (!installationId || !owner || !repo || !title || !body) {
        return reply.code(400).send({ error: "Missing required fields" });
      }

      try {
        let finalBody = body;

        // Upload to S3 if screenshot exists
        if (screenshotBuffer && screenshotMime && bucketName) {
          const fileKey = `snapshots/${uuidv4()}.png`;
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
              Body: screenshotBuffer,
              ContentType: screenshotMime,
            })
          );

          const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
          finalBody += `\n\n![Screenshot](${publicUrl})`;
        } else if (screenshotBuffer && !bucketName) {
          request.log.warn(
            "S3_BUCKET_NAME not set, skipping screenshot upload"
          );
        }

        const octokit = await fastify.getGitHubClient(installationId);

        const issue = await octokit.rest.issues.create({
          owner,
          repo,
          title,
          body: finalBody,
          labels: labels || ["wafir-feedback"],
        });

        reply.code(201).send({
          success: true,
          issueUrl: issue.data.html_url,
          issueNumber: issue.data.number,
        });
      } catch (error: any) {
        request.log.error(error);
        return reply
          .code(500)
          .send({ error: "Submission Failed", message: error.message });
      }
    }
  );
};

export default submitRoute;
