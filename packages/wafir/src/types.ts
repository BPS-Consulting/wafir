export type FieldType =
  | "input" // GitHub Issue Forms (text)
  | "email" // Wafir extension
  | "textarea" // GitHub Issue Forms
  | "dropdown" // GitHub Issue Forms (select)
  | "checkboxes" // GitHub Issue Forms (checkbox)
  | "markdown" // GitHub Issue Forms (markdown/informational)
  | "rating"; // Wafir extension

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  hidden?: boolean;
  defaultValue?: string;
  ratingLabels?: string[];
}

export type TabIcon = "thumbsup" | "lightbulb" | "bug";

export interface TabConfig {
  id: string;
  label: string;
  icon?: TabIcon;
  isFeedback?: boolean;
  fields: FieldConfig[];
}
