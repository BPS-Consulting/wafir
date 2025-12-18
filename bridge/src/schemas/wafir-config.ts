export const wafirConfigSchema = {
  $id: "wafirConfig",
  type: "object",
  properties: {
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
        projectId: { type: "number" },
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
        labels: {
          type: "array",
          items: { type: "string" },
          default: ["bug"],
        },
      },
      additionalProperties: false,
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
  },
  additionalProperties: false,
} as const;
