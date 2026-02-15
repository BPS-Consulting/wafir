// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export interface SubmitBody {
  configUrl?: string;
  targetType?: string;
  target?: string;
  authRef?: string;
  title: string;
  formId?: string;
  labels?: string[];
  formFields?: Record<string, unknown>;
  fieldOrder?: string[];
  browserInfo?: {
    url?: string;
    userAgent?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    language?: string;
  };
  consoleLogs?: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

// Keys to exclude from the markdown body (used for other purposes)
const EXCLUDED_FORM_KEYS = new Set(["title"]);

/**
 * Submit service - handles submission business logic
 */
export class SubmitService {
  /**
   * Converts a numeric rating (1-5) to star emojis.
   */
  ratingToStars(rating: number): string {
    const clampedRating = Math.min(Math.max(Math.round(rating), 1), 5);
    return "⭐".repeat(clampedRating);
  }

  /**
   * Formats a field label to be human-readable (capitalize, replace underscores).
   */
  formatFieldLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }

  /**
   * Builds a markdown body from form fields.
   */
  buildMarkdownFromFields(
    formFields: Record<string, unknown>,
    fieldOrder?: string[],
  ): string {
    const orderedKeys = fieldOrder?.length
      ? fieldOrder.filter((key) => key in formFields)
      : Object.keys(formFields);

    const lines: string[] = [];

    for (const key of orderedKeys) {
      if (EXCLUDED_FORM_KEYS.has(key)) continue;

      const value = formFields[key];
      if (value === undefined || value === null || value === "") continue;

      const label = this.formatFieldLabel(key);
      let displayValue: string;

      if (key === "rating" && typeof value === "number") {
        displayValue = this.ratingToStars(value);
      } else if (Array.isArray(value)) {
        displayValue = value.join(", ");
      } else {
        displayValue = String(value);
      }

      lines.push(`**${label}**\n${displayValue}`);
    }

    return lines.join("\n\n");
  }

  /**
   * Appends browser info as markdown if provided.
   */
  appendBrowserInfo(
    body: string,
    browserInfo?: SubmitBody["browserInfo"],
  ): string {
    if (!browserInfo) return body;

    const infoLines: string[] = [];
    if (browserInfo.url) infoLines.push(`| URL | ${browserInfo.url} |`);
    if (browserInfo.userAgent)
      infoLines.push(`| User Agent | \`${browserInfo.userAgent}\` |`);
    if (browserInfo.viewportWidth && browserInfo.viewportHeight)
      infoLines.push(
        `| Viewport | ${browserInfo.viewportWidth}x${browserInfo.viewportHeight} |`,
      );
    if (browserInfo.language)
      infoLines.push(`| Language | ${browserInfo.language} |`);

    if (infoLines.length === 0) return body;

    const browserSection = `\n\n---\n\n**Browser Info**\n| Field | Value |\n| :--- | :--- |\n${infoLines.join("\n")}`;
    return body + browserSection;
  }

  /**
   * Appends console logs as markdown if provided.
   */
  appendConsoleLogs(
    body: string,
    consoleLogs?: SubmitBody["consoleLogs"],
  ): string {
    if (!consoleLogs || consoleLogs.length === 0) return body;

    const logsText = consoleLogs
      .map((log) => `[${log.type.toUpperCase()}] ${log.message}`)
      .join("\n");

    return body + `\n\n---\n\n**Console Logs**\n\`\`\`\n${logsText}\n\`\`\``;
  }

  /**
   * Uploads screenshot to S3 and returns the markdown formatted image string.
   */
  async uploadScreenshot(
    s3Client: S3Client,
    bucketName: string | undefined,
    buffer: Buffer,
    mime: string,
    region: string | undefined,
  ): Promise<string> {
    if (!bucketName) return "";

    const fileKey = `snapshots/${uuidv4()}.png`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: mime,
        ACL: "public-read",
      }),
    );

    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
    return `\n\n![Screenshot](${publicUrl})`;
  }
}
