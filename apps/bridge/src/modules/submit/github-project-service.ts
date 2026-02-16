// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

const ADD_TO_PROJECT_MUTATION = `
  mutation AddToProject($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
      item { id }
    }
  }
`;

const ADD_DRAFT_TO_PROJECT_MUTATION = `
  mutation AddDraftToProject($projectId: ID!, $title: String!, $body: String) {
    addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body }) {
      projectItem { id }
    }
  }
`;

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
          }
        }
      }
    }
  }
`;

const UPDATE_PROJECT_FIELD_MUTATION = `
  mutation UpdateProjectField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: $value
    }) {
      projectV2Item { id }
    }
  }
`;

export interface ProjectLookupResult {
  nodeId: string | undefined;
  shouldUseUserToken: boolean;
  error?: string;
}

export interface ProjectAddResult {
  added: boolean;
  error?: string;
  itemId?: string;
}

export interface ProjectFieldResult {
  success: boolean;
  error?: string;
}

export interface ProjectFieldsResult {
  successCount: number;
  failures: Array<{ field: string; error: string }>;
}

/**
 * GitHub Project Service - handles GitHub Projects V2 operations
 */
export class GitHubProjectService {
  /**
   * Finds the ProjectV2 Node ID.
   */
  async findProjectNodeId(
    appOctokit: any,
    userOctokit: any | null,
    owner: string,
    number: number,
    log: any,
  ): Promise<ProjectLookupResult> {
    // Try with App Token - Organization first
    try {
      const result = await appOctokit.graphql(FIND_ORG_PROJECT_QUERY, {
        owner,
        number,
      });
      if (result.organization?.projectV2?.id) {
        return {
          nodeId: result.organization.projectV2.id,
          shouldUseUserToken: false,
        };
      }
    } catch (error: any) {
      log.debug({ error: error.message }, "Org project lookup failed");
    }

    // Try with App Token - User project
    try {
      const result = await appOctokit.graphql(FIND_USER_PROJECT_QUERY, {
        owner,
        number,
      });
      if (result.user?.projectV2?.id) {
        return { nodeId: result.user.projectV2.id, shouldUseUserToken: true };
      }
    } catch (error: any) {
      log.debug({ error: error.message }, "User project lookup failed");
    }

    // Retry with User Token
    if (userOctokit) {
      try {
        const result = await userOctokit.graphql(FIND_USER_PROJECT_QUERY, {
          owner,
          number,
        });
        if (result.user?.projectV2?.id) {
          return { nodeId: result.user.projectV2.id, shouldUseUserToken: true };
        }
      } catch (error: any) {
        log.error({ error: error.message }, "User token project lookup failed");
      }
    }

    return {
      nodeId: undefined,
      shouldUseUserToken: false,
      error: `Could not find project #${number} for owner ${owner}`,
    };
  }

  /**
   * Adds an item (Draft or Existing Issue) to a Project V2.
   */
  async addToProject(params: {
    appOctokit: any;
    userOctokit: any | null;
    projectOwner: string;
    projectNumber: number;
    title: string;
    body: string;
    issueNodeId?: string;
    log: any;
  }): Promise<ProjectAddResult> {
    const {
      appOctokit,
      userOctokit,
      projectOwner,
      projectNumber,
      issueNodeId,
      title,
      body,
      log,
    } = params;

    const {
      nodeId: projectId,
      shouldUseUserToken,
      error: lookupError,
    } = await this.findProjectNodeId(
      appOctokit,
      userOctokit,
      projectOwner,
      projectNumber,
      log,
    );

    if (!projectId) return { added: false, error: lookupError };

    const client = shouldUseUserToken && userOctokit ? userOctokit : appOctokit;

    try {
      if (issueNodeId) {
        // Link existing issue to project - capture the item ID for field updates
        const result: any = await client.graphql(ADD_TO_PROJECT_MUTATION, {
          projectId,
          contentId: issueNodeId,
        });
        return { added: true, itemId: result.addProjectV2ItemById.item.id };
      } else {
        const result: any = await client.graphql(
          ADD_DRAFT_TO_PROJECT_MUTATION,
          {
            projectId,
            title,
            body,
          },
        );
        return {
          added: true,
          itemId: result.addProjectV2DraftIssue.projectItem.id,
        };
      }
    } catch (e: any) {
      return { added: false, error: e.message };
    }
  }

  /**
   * Sets any project field on a project item.
   */
  async setProjectField(params: {
    octokit: any;
    projectId: string;
    itemId: string;
    fieldName: string;
    fieldValue: string | number;
    log: any;
  }): Promise<ProjectFieldResult> {
    const { octokit, projectId, itemId, fieldName, fieldValue, log } = params;

    try {
      const fieldsResult: any = await octokit.graphql(
        FIND_PROJECT_FIELDS_QUERY,
        { projectId },
      );

      const fields = fieldsResult.node?.fields?.nodes || [];
      const field = fields.find(
        (f: any) => f?.name?.toLowerCase() === fieldName.toLowerCase(),
      );

      if (!field) {
        return {
          success: false,
          error: `Field "${fieldName}" not found`,
        };
      }

      const dataType = field.dataType;
      let value: Record<string, string | number>;

      if (dataType === 'SINGLE_SELECT') {
        let matchingOption: any;
        
        // If the value is a number, use it as a 1-based index into options
        if (typeof fieldValue === 'number') {
          const index = fieldValue - 1; // Convert 1-based to 0-based index
          if (index >= 0 && index < (field.options?.length || 0)) {
            matchingOption = field.options[index];
          }
        } else {
          // Otherwise, match by name (case-insensitive)
          matchingOption = field.options?.find(
            (opt: any) =>
              opt.name.toLowerCase() === String(fieldValue).toLowerCase(),
          );
        }

        if (!matchingOption) {
          return {
            success: false,
            error: `No option matching "${fieldValue}" in field "${fieldName}"`,
          };
        }

        value = { singleSelectOptionId: matchingOption.id };
      } else if (dataType === 'TEXT') {
        value = { text: String(fieldValue) };
      } else if (dataType === 'NUMBER') {
        const numValue =
          typeof fieldValue === 'number' ? fieldValue : parseFloat(String(fieldValue));
        if (isNaN(numValue)) {
          return {
            success: false,
            error: `Invalid number value "${fieldValue}" for field "${fieldName}"`
          };
        }
        value = { number: numValue };
      } else if (dataType === 'DATE') {
        value = { date: String(fieldValue) };
      } else {
        return {
          success: false,
          error: `Unsupported field type "${dataType}" for field "${fieldName}"`,
        };
      }

      await octokit.graphql(UPDATE_PROJECT_FIELD_MUTATION, {
        projectId,
        itemId,
        fieldId: field.id,
        value,
      });

      log.info(
        { fieldName, fieldValue, itemId },
        'Set field on project item',
      );
      return { success: true };
    } catch (e: any) {
      log.error({ error: e.message }, `Failed to set field "${fieldName}"`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Sets multiple project fields on a project item from form fields.
   * Fields are matched by field ID to project field name (case-insensitive).
   * Fields that don't match any project field are silently skipped.
   */
  async setProjectFields(params: {
    octokit: any;
    projectId: string;
    itemId: string;
    formFields: Record<string, unknown>;
    log: any;
  }): Promise<ProjectFieldsResult> {
    const { octokit, projectId, itemId, formFields, log } = params;
    const result: ProjectFieldsResult = { successCount: 0, failures: [] };

    // Fields to skip (these are used elsewhere, not as project fields)
    const skipFields = new Set(['title', 'body', 'description']);

    try {
      // Fetch all project fields once
      const fieldsResult: any = await octokit.graphql(
        FIND_PROJECT_FIELDS_QUERY,
        { projectId },
      );

      const projectFields = fieldsResult.node?.fields?.nodes || [];

      // Normalize a field name for matching: lowercase and convert spaces to dashes
      // This matches how generate service creates form field IDs from project field names
      const normalizeFieldName = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

      // Create a map for normalized field lookup
      const fieldMap = new Map<string, any>();
      for (const field of projectFields) {
        if (field?.name) {
          fieldMap.set(normalizeFieldName(field.name), field);
        }
      }

      // Process each form field
      for (const [fieldId, fieldValue] of Object.entries(formFields)) {
        // Skip special fields and empty values
        if (skipFields.has(fieldId.toLowerCase())) {
          continue;
        }
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          continue;
        }

        // Find matching project field (normalize both names for comparison)
        const projectField = fieldMap.get(normalizeFieldName(fieldId));
        if (!projectField) {
          log.debug({ fieldId }, 'No matching project field found, skipping');
          continue;
        }

        try {
          const updateResult = await this.updateSingleField({
            octokit,
            projectId,
            itemId,
            field: projectField,
            fieldValue,
            log,
          });

          if (updateResult.success) {
            result.successCount++;
          } else if (updateResult.error) {
            result.failures.push({ field: fieldId, error: updateResult.error });
          }
        } catch (e: any) {
          result.failures.push({ field: fieldId, error: e.message });
        }
      }
    } catch (e: any) {
      log.error({ error: e.message }, 'Failed to fetch project fields');
      result.failures.push({ field: '_all', error: `Failed to fetch project fields: ${e.message}` });
    }

    if (result.successCount > 0) {
      log.info(
        { successCount: result.successCount, failureCount: result.failures.length },
        'Set project fields on item',
      );
    }

    return result;
  }

  /**
   * Updates a single project field value.
   * Internal helper for setProjectFields().
   */
  private async updateSingleField(params: {
    octokit: any;
    projectId: string;
    itemId: string;
    field: any;
    fieldValue: unknown;
    log: any;
  }): Promise<ProjectFieldResult> {
    const { octokit, projectId, itemId, field, fieldValue, log } = params;
    const dataType = field.dataType;
    let value: Record<string, string | number>;

    if (dataType === 'SINGLE_SELECT') {
      let matchingOption: any;
      
      // If the value is a number, use it as a 1-based index into options
      if (typeof fieldValue === 'number') {
        const index = fieldValue - 1; // Convert 1-based to 0-based index
        if (index >= 0 && index < (field.options?.length || 0)) {
          matchingOption = field.options[index];
        }
      } else {
        // Otherwise, match by name (case-insensitive)
        matchingOption = field.options?.find(
          (opt: any) =>
            opt.name.toLowerCase() === String(fieldValue).toLowerCase(),
        );
      }

      if (!matchingOption) {
        return {
          success: false,
          error: `No option matching "${fieldValue}" in field "${field.name}"`,
        };
      }

      value = { singleSelectOptionId: matchingOption.id };
    } else if (dataType === 'TEXT') {
      // Handle arrays (e.g., checkboxes) by joining with comma
      const textValue = Array.isArray(fieldValue)
        ? fieldValue.join(', ')
        : String(fieldValue);
      value = { text: textValue };
    } else if (dataType === 'NUMBER') {
      const numValue =
        typeof fieldValue === 'number' ? fieldValue : parseFloat(String(fieldValue));
      if (isNaN(numValue)) {
        return {
          success: false,
          error: `Invalid number value "${fieldValue}" for field "${field.name}"`,
        };
      }
      value = { number: numValue };
    } else if (dataType === 'DATE') {
      value = { date: String(fieldValue) };
    } else {
      return {
        success: false,
        error: `Unsupported field type "${dataType}" for field "${field.name}"`,
      };
    }

    await octokit.graphql(UPDATE_PROJECT_FIELD_MUTATION, {
      projectId,
      itemId,
      fieldId: field.id,
      value,
    });

    log.debug({ fieldName: field.name, fieldValue, itemId }, 'Set field on project item');
    return { success: true };
  }
}
