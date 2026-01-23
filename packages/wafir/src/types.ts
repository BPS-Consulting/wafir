export type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "checkbox"
  | "screenshot"
  | "switch"
  | "rating";

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
