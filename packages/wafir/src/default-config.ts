import type {
  FieldConfigApi as FieldConfig,
  TabConfigApi as TabConfig,
} from "./api/client";

export const RATING_LABELS = [
  "Very Unsatisfied",
  "Unsatisfied",
  "Neither satisfied or unsatisfied",
  "Satisfied",
  "Very Satisfied",
];

export const DEFAULT_FEEDBACK_FIELDS: FieldConfig[] = [
  {
    id: "rating",
    type: "rating",
    attributes: {
      label: "How satisfied are you with our website?",
      ratingLabels: RATING_LABELS,
    },
    validations: {
      required: true,
    },
  },
  {
    id: "description",
    type: "textarea",
    attributes: {
      label: "What is the main reason for this rating?",
    },
    validations: {
      required: false,
    },
  },
];

export const DEFAULT_SUGGESTION_FIELDS: FieldConfig[] = [
  {
    id: "title",
    type: "input",
    attributes: {
      label: "What is your suggestion?",
    },
    validations: {
      required: true,
    },
  },
  {
    id: "description",
    type: "textarea",
    attributes: {
      label: "Additional information:",
    },
    validations: {
      required: false,
    },
  },
];

export const DEFAULT_ISSUE_FIELDS: FieldConfig[] = [
  {
    id: "title",
    type: "input",
    attributes: {
      label: "What issue did you encounter?",
    },
    validations: {
      required: true,
    },
  },
  {
    id: "description",
    type: "textarea",
    attributes: {
      label: "Additional information:",
    },
    validations: {
      required: true,
    },
  },
];

export const DEFAULT_TABS: TabConfig[] = [
  {
    id: "feedback",
    label: "Feedback",
    icon: "thumbsup",
    isFeedback: true,
    fields: DEFAULT_FEEDBACK_FIELDS,
  },
  {
    id: "suggestion",
    label: "Suggestion",
    icon: "lightbulb",
    isFeedback: false,
    fields: DEFAULT_SUGGESTION_FIELDS,
  },
  {
    id: "issue",
    label: "Issue",
    icon: "bug",
    isFeedback: false,
    fields: DEFAULT_ISSUE_FIELDS,
  },
];

/**
 * Ensures all fields and tabs have required subobjects (attributes, validations, fields as array)
 */
export function normalizeTab(tab: Partial<TabConfig>): TabConfig {
  return {
    id: tab.id || "",
    label: tab.label || tab.id || "",
    icon: tab.icon,
    isFeedback: tab.isFeedback ?? false,
    fields: (tab.fields || []).map(normalizeField),
  };
}

export function normalizeField(field: Partial<FieldConfig>): FieldConfig {
  return {
    ...field,
    id: field.id || "",
    type: field.type || "input",
    attributes: {
      ...field.attributes,
      label: field.attributes?.label || field.id || "",
      // fill other defaults here as needed
    },
    validations: { ...field.validations },
  };
}

export function getDefaultFields(tabId: string): FieldConfig[] {
  switch (tabId) {
    case "feedback":
      return DEFAULT_FEEDBACK_FIELDS.map(normalizeField);
    case "suggestion":
      return DEFAULT_SUGGESTION_FIELDS.map(normalizeField);
    case "issue":
      return DEFAULT_ISSUE_FIELDS.map(normalizeField);
    default:
      return [];
  }
}

export function getDefaultTabs(): TabConfig[] {
  return DEFAULT_TABS.map(normalizeTab);
}
