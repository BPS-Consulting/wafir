// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { FastifyRequest } from "fastify";
import { SubmitBody } from "./service.js";

export interface ParsedRequestData extends SubmitBody {
  screenshotBuffer?: Buffer;
  screenshotMime?: string;
}

/**
 * Request Parser Service - handles parsing multipart and JSON submissions
 */
export class RequestParserService {
  /**
   * Parses the incoming request, handling both Multipart (with screenshot) and JSON bodies.
   */
  async parseSubmitRequest(
    request: FastifyRequest,
  ): Promise<ParsedRequestData> {
    const result: Partial<ParsedRequestData> = {};

    if (request.isMultipart()) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "screenshot") {
          result.screenshotBuffer = await part.toBuffer();
          result.screenshotMime = part.mimetype;
        } else if (part.type === "field") {
          const val = part.value as string;
          switch (part.fieldname) {
            case "targetType":
              result.targetType = val;
              break;
            case "target":
              result.target = val;
              break;
            case "authRef":
              result.authRef = val;
              break;
            case "title":
              result.title = val;
              break;
            case "labels":
              try {
                result.labels = JSON.parse(val);
              } catch {
                result.labels = val.split(",").map((l) => l.trim());
              }
              break;
            case "formFields":
              try {
                result.formFields = JSON.parse(val);
              } catch {
                result.formFields = {};
              }
              break;
            case "fieldOrder":
              try {
                result.fieldOrder = JSON.parse(val);
              } catch {
                result.fieldOrder = [];
              }
              break;
            case "browserInfo":
              try {
                result.browserInfo = JSON.parse(val);
              } catch {
                result.browserInfo = undefined;
              }
              break;
            case "consoleLogs":
              try {
                result.consoleLogs = JSON.parse(val);
              } catch {
                result.consoleLogs = [];
              }
              break;
            case "configUrl":
              result.configUrl = val;
              break;
            case "formId":
              result.formId = val;
              break;
          }
        }
      }
    } else {
      Object.assign(result, request.body as SubmitBody);
    }

    // Validation: If configUrl is null or not provided, require authRef and target info
    if (!result.configUrl) {
      if (!result.targetType || !result.target || !result.authRef) {
        throw new Error(
          "Missing required fields (targetType, target, or authRef)",
        );
      }
    }

    // Get title from formFields if not provided directly
    if (!result.title && result.formFields?.title) {
      result.title = String(result.formFields.title);
    }

    if (!result.title) {
      throw new Error("Missing required field: title");
    }

    return result as ParsedRequestData;
  }
}
