const fieldSchema = {
  type: "object",
  required: ["type"],
  properties: {
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
        "Field input type. Matches GitHub Form Schema types plus Wafir extensions.",
    },
    id: {
      type: "string",
      description:
        "Unique identifier for the field (used as key in JSON output/issue body).",
    },
    attributes: {
      type: "object",
      description: "Visual and behavioral attributes for the field.",
      properties: {
        label: {
          type: "string",
          description: "Display label for the field.",
        },
        description: {
          type: "string",
          description: "Helper text displayed below the label.",
        },
        placeholder: {
          type: "string",
          description: "Placeholder text (input, textarea, email only).",
        },
        value: {
          type: "string",
          description: "Default value or the Markdown content (markdown type).",
        },
        render: {
          type: "string",
          description:
            "Syntax highlighting style for textarea (e.g., 'shell', 'javascript').",
        },
        multiple: {
          type: "boolean",
          description: "Allow multiple selections (dropdown type only).",
        },
        options: {
          description: "Options for dropdown or checkboxes.",
          oneOf: [
            {
              // Dropdown options are an array of strings
              type: "array",
              items: { type: "string" },
            },
            {
              // Checkbox options are an array of objects
              type: "array",
              items: {
                type: "object",
                required: ["label"],
                properties: {
                  label: { type: "string" },
                  required: { type: "boolean" },
                },
              },
            },
          ],
        },
        // Wafir Extension Attribute
        ratingLabels: {
          type: "array",
          items: { type: "string" },
          description: "Custom labels for star rating (Wafir extension only).",
        },
      },
    },
    validations: {
      type: "object",
      properties: {
        required: {
          type: "boolean",
          description: "Whether the field is required.",
        },
      },
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
    currentDate: {
      type: "boolean",
      default: false,
      description:
        "If true, the current date and time will be automatically inserted into the issue body in a human-readable format",
    },
    fields: {
      oneOf: [
        {
          type: "array",
          items: fieldSchema,
          description: "Array of field configurations",
        },
        {
          type: "string",
          format: "uri",
          description:
            "URL to a YAML file containing a GitHub Issue Form template (https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)",
        },
      ],
      description:
        "Form fields for this tab. Can be an array of field objects or a URL to a GitHub Issue Form YAML template. If omitted, defaults are used for known tab IDs.",
    },
    targets: {
      type: "array",
      items: { type: "string" },
      description:
        "IDs of target(s) for this tab. If omitted or empty, all targets will be used. Each ID must reference a valid target from the top-level targets array.",
    },
  },
};

export const wafirConfigSchema = {
  $id: "wafirConfig",
  type: "object",
  required: ["targets"],
  properties: {
    title: {
      type: "string",
      default: "Contact Us",
      description: "Modal title",
    },
    targets: {
      type: "array",
      minItems: 1,
      description:
        "Target destinations for form submissions. Each target defines where and how submissions are stored.",
      items: {
        type: "object",
        required: ["id", "type", "target", "authRef"],
        properties: {
          id: {
            type: "string",
            description:
              "Unique identifier for this target, referenced by tabs to route submissions.",
          },
          type: {
            type: "string",
            enum: ["github/issues", "github/project"],
            description:
              "Target type using MIME-type convention. Currently supported: github/issues, github/project.",
          },
          target: {
            type: "string",
            description:
              "Target identifier. Format depends on type: 'owner/repo' for github/issues, 'owner/projectNum' for github/project.",
          },
          authRef: {
            type: "string",
            description:
              "Authentication reference used to authorize communication with the target. For GitHub types, this is the installation ID.",
          },
        },
        additionalProperties: false,
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
