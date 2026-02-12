// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import yaml from "js-yaml";

export interface ConfigQuery {
  installationId: number;
  owner: string;
  repo: string;
}

/**
 * Config service - handles fetching and parsing wafir config
 */
export class ConfigService {
  /**
   * Fetches and parses .github/wafir.yaml from the target repository
   */
  async fetchWafirConfig(
    octokit: any,
    owner: string,
    repo: string,
  ): Promise<any> {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".github/wafir.yaml",
    });

    if (!("content" in data)) {
      throw new Error("File not found or is a directory");
    }

    // Decode Base64 and parse YAML
    const yamlContent = Buffer.from(data.content, "base64").toString("utf-8");
    return yaml.load(yamlContent) as any;
  }

  /**
   * Fetches issue types from organization (if available)
   */
  async fetchIssueTypes(
    octokit: any,
    owner: string,
    log: any,
  ): Promise<{ id: number; name: string; color: string }[]> {
    try {
      const { data: ownerData } = await octokit.rest.users.getByUsername({
        username: owner,
      });

      if (ownerData.type === "Organization") {
        const { data: orgTypes } = await octokit.request(
          "GET /orgs/{org}/issue-types",
          { org: owner },
        );
        return orgTypes.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color,
        }));
      }
    } catch (typeError: any) {
      log.debug("Could not fetch issue types (org may not support them)");
    }

    return [];
  }
}
