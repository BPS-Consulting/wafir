// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import yaml from "js-yaml";

export interface ConfigQuery {
  configUrl: string;
}

export interface TemplateQuery {
  templateUrl: string;
}

/**
 * Represents a GitHub Issue Form template structure.
 */
export interface GitHubIssueFormTemplate {
  name?: string;
  description?: string;
  title?: string;
  labels?: string[];
  assignees?: string[];
  body?: any[];
}

/**
 * Config service - handles fetching and parsing wafir config
 */
export class ConfigService {
  /**
   * Fetches and parses a wafir configuration file from a URL.
   * Supports both YAML and JSON formats.
   * @param configUrl - URL to the raw configuration file
   * @returns Parsed configuration object
   */
  async fetchConfigFromUrl(configUrl: string): Promise<any> {
    // Validate URL
    let url: URL;
    try {
      url = new URL(configUrl);
    } catch {
      throw new Error("Invalid URL: " + configUrl);
    }

    // Fetch the config file
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "text/plain, application/json, application/x-yaml, text/yaml",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const error = new Error(
        `Failed to fetch config: HTTP ${response.status}`,
      );
      (error as any).status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    // Determine format based on content-type or URL extension
    const isYaml =
      contentType.includes("yaml") ||
      contentType.includes("x-yaml") ||
      configUrl.endsWith(".yaml") ||
      configUrl.endsWith(".yml");

    if (isYaml) {
      return yaml.load(text) as any;
    } else {
      // Try JSON parsing
      try {
        return JSON.parse(text);
      } catch {
        // If JSON fails, try YAML as fallback (YAML is a superset of JSON)
        return yaml.load(text) as any;
      }
    }
  }

  /**
   * Fetches and parses a GitHub Issue Form template from a URL.
   * Returns the body (fields) and labels from the template.
   * @param templateUrl - URL to the raw template file
   * @returns Parsed template with body and labels
   */
  async fetchTemplateFromUrl(
    templateUrl: string,
  ): Promise<{ body: any[]; labels?: string[] }> {
    // Validate URL
    let url: URL;
    try {
      url = new URL(templateUrl);
    } catch {
      throw new Error("Invalid URL: " + templateUrl);
    }

    // Fetch the template file
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "text/plain, application/json, application/x-yaml, text/yaml",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const error = new Error(
        `Failed to fetch template: HTTP ${response.status}`,
      );
      (error as any).status = response.status;
      throw error;
    }

    const text = await response.text();
    const template = yaml.load(text) as GitHubIssueFormTemplate;

    if (!template || !template.body || !Array.isArray(template.body)) {
      throw new Error("Invalid template format: missing body array");
    }

    return {
      body: template.body,
      labels: template.labels,
    };
  }
}
