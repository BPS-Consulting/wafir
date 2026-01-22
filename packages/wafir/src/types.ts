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
  id: string; // The key for the data (e.g., 'description', 'browser_info')
  label: string; // Display text
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select lists (e.g., project status)
  hidden?: boolean; // For auto-collected data like logs
  defaultValue?: string;
  ratingLabels?: string[];
}
