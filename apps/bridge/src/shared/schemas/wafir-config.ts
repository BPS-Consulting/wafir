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
        "date",
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
        default: {
          type: "integer",
          description:
            "Index of the pre-selected option in the options array (dropdown type only).",
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
        // Wafir Extension: Auto-fill attribute for telemetry fields
        autofill: {
          type: "string",
          enum: ["browserInfo", "screenshot", "consoleLog"],
          description:
            "Auto-fill the field with telemetry data. When specified, renders an opt-in checkbox. Values: browserInfo (URL, user agent, viewport), screenshot (captured screenshot), consoleLog (recent console messages).",
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

const formSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", description: "Unique form identifier" },
    label: {
      type: "string",
      description: "Display label (defaults to capitalized id)",
    },
    icon: {
      type: "string",
      enum: ["thumbsup", "lightbulb", "bug"],
      description: "Form icon (displayed in tab UI)",
    },
    body: {
      type: "array",
      items: fieldSchema,
      description:
        "Form body (fields) for this form. If omitted, defaults are used for known form IDs.",
    },
    targets: {
      type: "array",
      items: { type: "string" },
      description:
        "IDs of target(s) for this form. If omitted or empty, all targets will be used. Each ID must reference a valid target from the top-level targets array.",
    },
    labels: {
      type: "array",
      items: { type: "string" },
      description:
        "Labels automatically added to issues created from this form. Similar to GitHub issue form templates.",
    },
    templateUrl: {
      type: "string",
      format: "uri",
      description:
        "URL to a GitHub issue form template YAML file. When provided, the form fields will be fetched from this template.",
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
              "Unique identifier for this target, referenced by forms to route submissions.",
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
    forms: {
      type: "array",
      items: formSchema,
      description:
        "Widget forms configuration. Forms are displayed as tabs in the UI. Defaults to feedback, suggestion, issue if omitted.",
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
  },
  additionalProperties: false,
} as const;
