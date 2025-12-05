// src/s3.ts
import { AwsClient } from "aws4fetch";

export class SnapStore {
  private client: AwsClient;
  private bucket: string;
  private publicUrl: string;

  constructor(env: any) {
    this.client = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION || "us-east-1",
    });
    this.bucket = env.AWS_BUCKET_NAME;
    // URL to access the uploaded file (e.g., https://my-bucket.s3.amazonaws.com)
    this.publicUrl =
      env.AWS_PUBLIC_URL || `https://${env.AWS_BUCKET_NAME}.s3.amazonaws.com`;
  }

  async upload(file: File, folder: string = "reports"): Promise<string> {
    const filename = `${folder}/${Date.now()}-${file.name}`;
    const url = `https://${this.bucket}.s3.amazonaws.com/${filename}`;

    // Upload to S3
    const response = await this.client.fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read", // Ensure it's viewable in the issue
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`S3 Upload Failed: ${response.statusText}`);
    }

    return `${this.publicUrl}/${filename}`;
  }
}
