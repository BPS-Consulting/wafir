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
   * @param rating - The rating value (0 means no rating, 1-maxRating for actual ratings)
   * @param maxRating - Maximum rating value (defaults to 5)
   * @param icon - The icon character to repeat (defaults to ⭐)
   */
  ratingToIcons(rating: number, maxRating = 5, icon = "⭐"): string {
    const clampedRating = Math.min(Math.max(Math.round(rating), 0), maxRating);
    // Allow 0 to represent no rating
    if (clampedRating === 0) {
      return "No rating";
    }
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
   * @param fieldConfigs - Optional array of field configurations to determine field types
   */
  buildMarkdownFromFields(
    formFields: Record<string, unknown>,
    fieldOrder?: string[],
    fieldLabels?: Record<string, string>,
    excludeFields?: Set<string>,
    fieldConfigs?: Array<{
      id?: string;
      type: string;
      attributes?: {
        icon?: string;
        options?: string[] | Array<{ label: string; required?: boolean }>;
      };
    }>,
  ): string {
    const orderedKeys = fieldOrder?.length
      ? fieldOrder.filter((key) => key in formFields)
      : Object.keys(formFields);

    const lines: string[] = [];

    // Build a map of field IDs to their types for quick lookup
    const fieldTypeMap = new Map<
      string,
      { type: string; icon?: string; maxRating?: number }
    >();
    if (fieldConfigs) {
      for (const config of fieldConfigs) {
        if (config.id) {
          // Calculate maxRating from options array length
          let maxRating = 5; // default
          if (config.attributes?.options) {
            maxRating = config.attributes.options.length;
          }
          fieldTypeMap.set(String(config.id), {
            type: config.type,
            icon: config.attributes?.icon,
            maxRating,
          });
        }
      }
    }

    for (const key of orderedKeys) {
      if (EXCLUDED_FORM_KEYS.has(key)) continue;
      if (excludeFields?.has(key)) continue;

      const value = formFields[key];
      // Skip undefined, null, or empty string
      // Note: 0 will not be skipped by this check (e.g., ratings show "No rating" for 0)
      if (value === undefined || value === null || value === "") continue;

      // Use provided label if available, otherwise format from field ID
      const label = fieldLabels?.[key] || this.formatFieldLabel(key);
      let displayValue: string;

      const fieldType = fieldTypeMap.get(key)?.type;

      // Check if this is a rating field by type, or fallback to key name
      if (
        (fieldType === "rating" || key === "rating") &&
        typeof value === "number"
      ) {
        const icon = fieldTypeMap.get(key)?.icon || "⭐";
        const maxRating = fieldTypeMap.get(key)?.maxRating || 5;
        displayValue = this.ratingToIcons(value, maxRating, icon);
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
