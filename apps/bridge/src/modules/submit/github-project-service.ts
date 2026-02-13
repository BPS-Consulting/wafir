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
  mutation UpdateProjectField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item { id }
    }
  }
`;

const UPDATE_PROJECT_DATE_FIELD_MUTATION = `
  mutation UpdateProjectDateField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $dateValue: Date!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { date: $dateValue }
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

export interface RatingFieldResult {
  success: boolean;
  error?: string;
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
        await client.graphql(ADD_TO_PROJECT_MUTATION, {
          projectId,
          contentId: issueNodeId,
        });
        return { added: true };
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
   * Sets the Rating field on a project item.
   */
  async setProjectRatingField(params: {
    octokit: any;
    projectId: string;
    itemId: string;
    ratingFieldName: string;
    rating: number;
    log: any;
  }): Promise<RatingFieldResult> {
    const { octokit, projectId, itemId, ratingFieldName, rating, log } = params;

    try {
      const fieldsResult: any = await octokit.graphql(
        FIND_PROJECT_FIELDS_QUERY,
        {
          projectId,
        },
      );

      const fields = fieldsResult.node?.fields?.nodes || [];
      const ratingField = fields.find(
        (f: any) => f?.name?.toLowerCase() === ratingFieldName.toLowerCase(),
      );

      if (!ratingField) {
        return {
          success: false,
          error: `Field "${ratingFieldName}" not found`,
        };
      }

      const starEmojis = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
      const targetEmoji = starEmojis[Math.min(Math.max(rating - 1, 0), 4)];

      const matchingOption = ratingField.options?.find(
        (opt: any) => opt.name === targetEmoji,
      );

      if (!matchingOption) {
        return {
          success: false,
          error: `No option matching "${targetEmoji}" in Rating field`,
        };
      }

      await octokit.graphql(UPDATE_PROJECT_FIELD_MUTATION, {
        projectId,
        itemId,
        fieldId: ratingField.id,
        optionId: matchingOption.id,
      });

      log.info({ rating, itemId }, "Set Rating field on project item");
      return { success: true };
    } catch (e: any) {
      log.error({ error: e.message }, "Failed to set Rating field");
      return { success: false, error: e.message };
    }
  }

  /**
   * Sets a date field on a project item if a field starting with "Submitted" is found.
   */
  async setSubmittedDateField(params: {
    octokit: any;
    projectId: string;
    itemId: string;
    log: any;
  }): Promise<RatingFieldResult> {
    const { octokit, projectId, itemId, log } = params;

    try {
      const fieldsResult: any = await octokit.graphql(
        FIND_PROJECT_FIELDS_QUERY,
        {
          projectId,
        },
      );

      const fields = fieldsResult.node?.fields?.nodes || [];

      // Find a field that starts with "Submitted" and is a DATE type
      const submittedField = fields.find(
        (f: any) =>
          f?.name?.toLowerCase().startsWith("submitted") &&
          f?.dataType === "DATE",
      );

      if (!submittedField) {
        log.debug("No 'Submitted' date field found in project");
        return { success: true }; // Not an error, just not found
      }

      // Format current date as ISO date string (YYYY-MM-DD) for GitHub API
      const now = new Date();
      const dateValue = now.toISOString().split("T")[0];

      await octokit.graphql(UPDATE_PROJECT_DATE_FIELD_MUTATION, {
        projectId,
        itemId,
        fieldId: submittedField.id,
        dateValue,
      });

      log.info(
        { fieldName: submittedField.name, itemId, dateValue },
        "Set Submitted date field on project item",
      );
      return { success: true };
    } catch (e: any) {
      log.error({ error: e.message }, "Failed to set Submitted date field");
      return { success: false, error: e.message };
    }
  }
}
