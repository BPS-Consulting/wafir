export type FieldType =
  | "input" // GitHub Issue Forms (text)
  | "email" // Wafir extension
  | "textarea" // GitHub Issue Forms
  | "dropdown" // GitHub Issue Forms (select)
  | "checkboxes" // GitHub Issue Forms (checkbox)
  | "markdown" // GitHub Issue Forms (markdown/informational)
  | "rating"; // Wafir extension

export interface FieldAttributes {
  label: string;
  description?: string;
  placeholder?: string;
  value?: string;
  render?: string;
  multiple?: boolean;
  options?: string[] | Array<{ label: string; required?: boolean }>;
  ratingLabels?: string[];
  hidden?: boolean;
}

export interface FieldValidations {
  required?: boolean;
}

export interface FieldConfig {
  id: string;
  type: FieldType;
  attributes: FieldAttributes;
  validations?: FieldValidations;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  isFeedback?: boolean;
  fields: FieldConfig[];
}
