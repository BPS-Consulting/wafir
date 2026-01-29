const fieldSchema = {
  type: "object",
  required: ["name", "label", "type"],
  properties: {
    name: { type: "string", description: "Field ID/key for form data" },
    label: { type: "string", description: "Display label for the field" },
    type: {
      type: "string",
      enum: [
        "input",
        "email",
        "textarea",
        "dropdown",
        "checkboxes",
        "markdown",
        "rating",
      ],
      description:
        "Field input type. Allowed types:\n- input: Single-line text (GitHub Issue Forms type)\n- textarea: Multiline text (GitHub Issue Forms type)\n- dropdown: Single-select options (GitHub Issue Forms type)\n- checkboxes: Multi-select options (GitHub Issue Forms type)\n- markdown: For headings, descriptions (GitHub Issue Forms type)\n- email: Single-line email input (Wafir extension, not in GitHub Issue Forms)\n- rating: Star rating field (Wafir extension, not in GitHub Issue Forms)",
    },
    required: { type: "boolean", default: false },
    placeholder: { type: "string" },
    options: {
      type: "array",
      items: { type: "string" },
      description: "Options for dropdown or checkboxes field types only.",
    },
    ratingLabels: {
      type: "array",
      items: { type: "string" },
      description:
        "Labels for each rating star (1-5). Only used for rating field (Wafir extension).",
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
    telemetry: {
      type: "object",
      description: "Automatic data collection settings",
      properties: {
        screenshot: {
          type: "boolean",
          default: true,
          description: "Enable screenshot capture",
        },
        browserInfo: {
          type: "boolean",
          default: true,
          description: "Collect URL, user agent, viewport, language",
        },
        consoleLog: {
          type: "boolean",
          default: false,
          description: "Capture console messages",
        },
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
