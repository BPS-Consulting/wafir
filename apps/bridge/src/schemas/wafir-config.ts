const fieldSchema = {
  type: "object",
  required: ["name", "label", "type"],
  properties: {
    name: { type: "string", description: "Field ID/key for form data" },
    label: { type: "string", description: "Display label for the field" },
    type: {
      type: "string",
      enum: ["text", "email", "textarea", "select", "checkbox", "rating"],
      description: "Input type",
    },
    required: { type: "boolean", default: false },
    placeholder: { type: "string" },
    options: {
      type: "array",
      items: { type: "string" },
      description: "Options for select type",
    },
    ratingLabels: {
      type: "array",
      items: { type: "string" },
      description: "Labels for each rating star (1-5)",
    },
  },
};

const tabSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", description: "Unique tab identifier" },
    label: {
      type: "string",
      description: "Display label (defaults to capitalized id)",
    },
    icon: {
      type: "string",
      enum: ["thumbsup", "lightbulb", "bug"],
      description: "Tab icon",
    },
    isFeedback: {
      type: "boolean",
      default: false,
      description:
        "If true, rating from this tab populates project Rating field",
    },
    fields: {
      type: "array",
      items: fieldSchema,
      description:
        "Form fields for this tab. If omitted, defaults are used for known tab IDs (feedback, issue, suggestion)",
    },
  },
};

export const wafirConfigSchema = {
  $id: "wafirConfig",
  type: "object",
  properties: {
    title: {
      type: "string",
      default: "Contact Us",
      description: "Modal title",
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
    tabs: {
      type: "array",
      items: tabSchema,
      description:
        "Widget tabs configuration. Defaults to feedback, suggestion, issue if omitted.",
    },
    issueTypes: {
      type: "array",
      description:
        "Available issue types from the organization (auto-populated)",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          color: { type: "string" },
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
