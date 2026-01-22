import type { FieldConfig } from "./types.js";

export type TabType = "feedback" | "suggestion" | "issue";

export interface TabDefinition {
  id: TabType;
  label: string;
  icon: "thumbsup" | "lightbulb" | "bug";
}

export const DEFAULT_TABS: TabDefinition[] = [
  { id: "feedback", label: "Feedback", icon: "thumbsup" },
  { id: "suggestion", label: "Suggestion", icon: "lightbulb" },
  { id: "issue", label: "Issue", icon: "bug" },
];

export const RATING_LABELS = [
  "Very Unsatisfied",
  "Unsatisfied",
  "Neither satisfied or unsatisfied",
  "Satisfied",
  "Very Satisfied",
];

export const DEFAULT_FEEDBACK_FORM: FieldConfig[] = [
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

export const DEFAULT_SUGGESTION_FORM: FieldConfig[] = [
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

export const DEFAULT_ISSUE_FORM: FieldConfig[] = [
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
    required: false,
  },
];

export function getDefaultFormConfig(tabType: TabType): FieldConfig[] {
  switch (tabType) {
    case "feedback":
      return DEFAULT_FEEDBACK_FORM;
    case "suggestion":
      return DEFAULT_SUGGESTION_FORM;
    case "issue":
      return DEFAULT_ISSUE_FORM;
  }
}

export type TabConfigs = Record<TabType, FieldConfig[]>;

export function getDefaultTabConfigs(): TabConfigs {
  return {
    feedback: [...DEFAULT_FEEDBACK_FORM],
    suggestion: [...DEFAULT_SUGGESTION_FORM],
    issue: [...DEFAULT_ISSUE_FORM],
  };
}
