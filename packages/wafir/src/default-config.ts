import type { FieldConfig, TabConfig } from "./types.js";

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
    label: "How satisfied are you with our website?",
    type: "rating",
    required: true,
    ratingLabels: RATING_LABELS,
  },
  {
    id: "description",
    label: "What is the main reason for this rating?",
    type: "textarea",
    required: false,
  },
];

export const DEFAULT_SUGGESTION_FIELDS: FieldConfig[] = [
  {
    id: "title",
    label: "What is your suggestion?",
    type: "text",
    required: true,
  },
  {
    id: "description",
    label: "Additional information:",
    type: "textarea",
    required: false,
  },
];

export const DEFAULT_ISSUE_FIELDS: FieldConfig[] = [
  {
    id: "title",
    label: "What issue did you encounter?",
    type: "text",
    required: true,
  },
  {
    id: "description",
    label: "Additional information:",
    type: "textarea",
    required: true,
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
    fields: DEFAULT_SUGGESTION_FIELDS,
  },
  {
    id: "issue",
    label: "Issue",
    icon: "bug",
    fields: DEFAULT_ISSUE_FIELDS,
  },
];

export function getDefaultFields(tabId: string): FieldConfig[] {
  switch (tabId) {
    case "feedback":
      return [...DEFAULT_FEEDBACK_FIELDS];
    case "suggestion":
      return [...DEFAULT_SUGGESTION_FIELDS];
    case "issue":
      return [...DEFAULT_ISSUE_FIELDS];
    default:
      return [];
  }
}

export function getDefaultTabs(): TabConfig[] {
  return DEFAULT_TABS.map((tab) => ({ ...tab, fields: [...tab.fields] }));
}
