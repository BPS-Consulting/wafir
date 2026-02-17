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
  /** Map of field IDs to their display labels */
  fieldLabels?: Record<string, string>;
}

// Keys to exclude from the markdown body (used for other purposes)
const EXCLUDED_FORM_KEYS = new Set(["title"]);

/**
 * Submit service - handles submission business logic
 */
export class SubmitService {
  /**
   * Converts a numeric rating to repeated icon characters.
   * @param rating - The rating value (1-based)
   * @param maxRating - Maximum rating value (defaults to 5)
   * @param icon - The icon character to repeat (defaults to ⭐)
   */
  ratingToIcons(rating: number, maxRating = 5, icon = "⭐"): string {
    const clampedRating = Math.min(Math.max(Math.round(rating), 1), maxRating);
    return icon.repeat(clampedRating);
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
   * @param formFields - The form field values keyed by field ID
   * @param fieldOrder - Optional array of field IDs specifying display order
   * @param fieldLabels - Optional map of field IDs to their display labels
   * @param excludeFields - Optional set of field IDs to exclude (e.g., fields written to project)
   */
  buildMarkdownFromFields(
    formFields: Record<string, unknown>,
    fieldOrder?: string[],
    fieldLabels?: Record<string, string>,
    excludeFields?: Set<string>,
  ): string {
    const orderedKeys = fieldOrder?.length
      ? fieldOrder.filter((key) => key in formFields)
      : Object.keys(formFields);

    const lines: string[] = [];

    for (const key of orderedKeys) {
      if (EXCLUDED_FORM_KEYS.has(key)) continue;
      if (excludeFields?.has(key)) continue;

      const value = formFields[key];
      if (value === undefined || value === null || value === "") continue;

      // Use provided label if available, otherwise format from field ID
      const label = fieldLabels?.[key] || this.formatFieldLabel(key);
      let displayValue: string;

      if (key === "rating" && typeof value === "number") {
        displayValue = this.ratingToIcons(value);
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
    return `\n\n**Screenshot**\n![Screenshot](${publicUrl})`;
  }
}
