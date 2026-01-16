export const wafirConfigSchema = {
  $id: "wafirConfig",
  type: "object",
  properties: {
    mode: {
      type: "string",
      enum: ["issue", "feedback", "both"],
      default: "issue",
      description:
        "Widget mode: 'issue' for bug reports, 'feedback' for ratings, 'both' for both options",
    },
    storage: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["issue", "project", "both"],
          default: "issue",
        },
        owner: { type: "string" },
        repo: { type: "string" },
        projectNumber: { type: "number" },
      },
    },
    feedback: {
      type: "object",
      properties: {
        title: { type: "string", default: "Feedback" },
        labels: {
          type: "array",
          items: { type: "string" },
          default: ["feedback"],
        },
      },
      additionalProperties: false,
    },
    issue: {
      type: "object",
      properties: {
        screenshot: { type: "boolean", default: false },
        browserInfo: { type: "boolean", default: false },
        consoleLog: { type: "boolean", default: false },
        types: {
          type: "boolean",
          default: true,
          description: "Fetch and display issue types from organization",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          default: ["bug"],
        },
      },
      additionalProperties: false,
    },
    issueTypes: {
      type: "array",
      description: "Available issue types from the organization",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          color: { type: "string" },
        },
      },
    },
    fields: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "label", "type"],
        properties: {
          name: { type: "string" },
          label: { type: "string" },
          type: {
            type: "string",
            enum: ["text", "textarea", "select", "checkbox"],
          },
          required: { type: "boolean", default: false },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Options for select type",
          },
        },
      },
    },
    feedbackProject: {
      type: "object",
      description:
        "Dedicated project for feedback submissions with star ratings",
      properties: {
        projectNumber: {
          type: "number",
          description: "GitHub Project number for feedback",
        },
        owner: {
          type: "string",
          description: "Project owner (defaults to repo owner)",
        },
        ratingField: {
          type: "string",
          default: "Rating",
          description: "Name of the Rating field in the project",
        },
      },
    },
  },
  additionalProperties: false,
} as const;
