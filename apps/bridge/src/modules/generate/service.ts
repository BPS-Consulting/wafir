// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import yaml from "js-yaml";

const FIND_ORG_PROJECT_QUERY = `
  query FindOrgProject($owner: String!, $number: Int!) {
    organization(login: $owner) { projectV2(number: $number) { id } }
  }
`;

const FIND_USER_PROJECT_QUERY = `
  query FindUserProject($owner: String!, $number: Int!) {
    user(login: $owner) { projectV2(number: $number) { id } }
  }
`;

const FIND_PROJECT_FIELDS_QUERY = `
  query FindProjectFields($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        title
        fields(first: 50) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              options {
                id
                name
              }
            }
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2IterationField {
              id
              name
              dataType
            }
          }
        }
      }
    }
  }
`;

export interface GenerateTarget {
  type: "github/issues" | "github/project";
  target: string;
}

export interface GenerateRequest {
  installationId: number;
  targets: GenerateTarget[];
}

interface ProjectField {
  name: string;
  dataType: string;
  options?: { id: string; name: string }[];
}

interface RepoLabel {
  name: string;
  color: string;
  description?: string;
}

interface TargetInfo {
  target: GenerateTarget;
  labels?: RepoLabel[];
  fields?: ProjectField[];
  projectTitle?: string;
  error?: string;
}

/**
 * Generate service - creates sample wafir.yaml configs from GitHub targets
 */
export class GenerateService {
  /**
   * Fetches labels from a GitHub repository
   */
  async fetchRepoLabels(
    octokit: any,
    owner: string,
    repo: string,
  ): Promise<RepoLabel[]> {
    const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });

    return labels.map((label: any) => ({
      name: label.name,
      color: label.color,
      description: label.description || undefined,
    }));
  }

  /**
   * Finds a project's node ID (tries org first, then user)
   */
  async findProjectNodeId(
    octokit: any,
    owner: string,
    number: number,
    log: any,
  ): Promise<string | null> {
    // Try organization project first
    try {
      const result = await octokit.graphql(FIND_ORG_PROJECT_QUERY, {
        owner,
        number,
      });
      if (result.organization?.projectV2?.id) {
        return result.organization.projectV2.id;
      }
    } catch (error: any) {
      log.debug({ error: error.message }, "Org project lookup failed");
    }

    // Try user project
    try {
      const result = await octokit.graphql(FIND_USER_PROJECT_QUERY, {
        owner,
        number,
      });
      if (result.user?.projectV2?.id) {
        return result.user.projectV2.id;
      }
    } catch (error: any) {
      log.debug({ error: error.message }, "User project lookup failed");
    }

    return null;
  }

  /**
   * Fetches fields from a GitHub project
   */
  async fetchProjectFields(
    octokit: any,
    owner: string,
    projectNumber: number,
    log: any,
  ): Promise<{ title: string; fields: ProjectField[] } | null> {
    const projectId = await this.findProjectNodeId(
      octokit,
      owner,
      projectNumber,
      log,
    );

    if (!projectId) {
      return null;
    }

    const result: any = await octokit.graphql(FIND_PROJECT_FIELDS_QUERY, {
      projectId,
    });

    const projectData = result.node;
    if (!projectData) {
      return null;
    }

    const fields: ProjectField[] = [];
    for (const field of projectData.fields?.nodes || []) {
      if (!field || !field.name) continue;

      // Skip built-in fields that can't be set via API
      const builtInFields = [
        "Title",
        "Assignees",
        "Labels",
        "Linked pull requests",
        "Milestone",
        "Repository",
        "Reviewers",
      ];
      if (builtInFields.includes(field.name)) continue;

      const fieldInfo: ProjectField = {
        name: field.name,
        dataType: field.dataType,
      };

      if (field.options) {
        fieldInfo.options = field.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
        }));
      }

      fields.push(fieldInfo);
    }

    return {
      title: projectData.title || "Untitled Project",
      fields,
    };
  }

  /**
   * Gathers information from all targets
   */
  async gatherTargetInfo(
    octokit: any,
    targets: GenerateTarget[],
    log: any,
  ): Promise<TargetInfo[]> {
    const results: TargetInfo[] = [];

    for (const target of targets) {
      const info: TargetInfo = { target };

      try {
        if (target.type === "github/issues") {
          const [owner, repo] = target.target.split("/");
          if (!owner || !repo) {
            info.error = `Invalid target format: ${target.target}. Expected "owner/repo"`;
          } else {
            info.labels = await this.fetchRepoLabels(octokit, owner, repo);
          }
        } else if (target.type === "github/project") {
          const [owner, numberStr] = target.target.split("/");
          const projectNumber = parseInt(numberStr, 10);
          if (!owner || isNaN(projectNumber)) {
            info.error = `Invalid target format: ${target.target}. Expected "owner/projectNumber"`;
          } else {
            const projectData = await this.fetchProjectFields(
              octokit,
              owner,
              projectNumber,
              log,
            );
            if (projectData) {
              info.projectTitle = projectData.title;
              info.fields = projectData.fields;
            } else {
              info.error = `Could not find project #${projectNumber} for owner ${owner}`;
            }
          }
        }
      } catch (error: any) {
        info.error = error.message;
      }

      results.push(info);
    }

    return results;
  }

  /**
   * Generates a sample wafir.yaml config from target info
   */
  generateConfig(
    installationId: number,
    targets: GenerateTarget[],
    targetInfo: TargetInfo[],
  ): string {
    const config: any = {
      targets: targets.map((t, i) => ({
        id: `target-${i + 1}`,
        type: t.type,
        target: t.target,
        authRef: String(installationId),
      })),
      forms: [],
    };

    // Generate forms based on target types
    for (let i = 0; i < targetInfo.length; i++) {
      const info = targetInfo[i];
      const targetId = `target-${i + 1}`;

      if (info.error) continue;

      if (info.target.type === "github/issues" && info.labels) {
        // Generate a form for issues with label selection
        const form: any = {
          id: `issue-form-${i + 1}`,
          label: "Report Issue",
          icon: "bug",
          targets: [targetId],
          body: [
            {
              id: "title",
              type: "input",
              attributes: {
                label: "Issue Title",
                placeholder: "Brief summary of the issue",
              },
              validations: { required: true },
            },
            {
              id: "description",
              type: "textarea",
              attributes: {
                label: "Description",
                placeholder: "Describe the issue in detail",
              },
              validations: { required: true },
            },
          ],
        };

        // Add label dropdown if there are labels
        if (info.labels.length > 0) {
          form.body.push({
            id: "label",
            type: "dropdown",
            attributes: {
              label: "Category",
              options: info.labels.slice(0, 10).map((l) => l.name),
            },
            validations: { required: false },
          });
        }

        config.forms.push(form);
      } else if (info.target.type === "github/project" && info.fields) {
        // Generate a form for project items
        const form: any = {
          id: `project-form-${i + 1}`,
          label: info.projectTitle || "Submit Feedback",
          icon: "thumbsup",
          targets: [targetId],
          body: [
            {
              id: "title",
              type: "input",
              attributes: {
                label: "Title",
                placeholder: "Brief summary",
              },
              validations: { required: true },
            },
            {
              id: "description",
              type: "textarea",
              attributes: {
                label: "Description",
                placeholder: "Provide details",
              },
              validations: { required: true },
            },
          ],
        };

        // Add fields based on project custom fields
        for (const field of info.fields) {
          const fieldConfig = this.mapProjectFieldToFormField(field);
          if (fieldConfig) {
            form.body.push(fieldConfig);
          }
        }

        config.forms.push(form);
      }
    }

    // If no forms were generated, add a default form
    if (config.forms.length === 0) {
      config.forms.push({
        id: "default",
        label: "Submit Feedback",
        icon: "thumbsup",
        targets: config.targets.map((t: any) => t.id),
        body: [
          {
            id: "title",
            type: "input",
            attributes: {
              label: "Title",
              placeholder: "Brief summary",
            },
            validations: { required: true },
          },
          {
            id: "description",
            type: "textarea",
            attributes: {
              label: "Description",
              placeholder: "Provide details",
            },
            validations: { required: true },
          },
        ],
      });
    }

    return yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
  }

  /**
   * Maps a GitHub project field to a wafir form field config
   */
  private mapProjectFieldToFormField(field: ProjectField): any | null {
    const fieldId = field.name.toLowerCase().replace(/\s+/g, "-");

    switch (field.dataType) {
      case "SINGLE_SELECT":
        if (!field.options || field.options.length === 0) return null;
        return {
          id: fieldId,
          type: "dropdown",
          attributes: {
            label: field.name,
            options: field.options.map((o) => o.name),
          },
          validations: { required: false },
        };

      case "TEXT":
        return {
          id: fieldId,
          type: "input",
          attributes: {
            label: field.name,
            placeholder: `Enter ${field.name.toLowerCase()}`,
          },
          validations: { required: false },
        };

      case "NUMBER":
        return {
          id: fieldId,
          type: "input",
          attributes: {
            label: field.name,
            placeholder: `Enter ${field.name.toLowerCase()}`,
          },
          validations: { required: false },
        };

      case "DATE":
        return {
          id: fieldId,
          type: "date",
          attributes: {
            label: field.name,
          },
          validations: { required: false },
        };

      default:
        // Skip unsupported field types (iteration, etc.)
        return null;
    }
  }
}
