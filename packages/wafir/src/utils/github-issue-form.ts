import yaml from "js-yaml";
import type { FieldObject as FieldConfigApi } from "../api/client.js";

/**
 * GitHub Issue Form field type from YAML template
 * See: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
 */
interface GitHubIssueFormField {
  type: "input" | "textarea" | "dropdown" | "checkboxes" | "markdown";
  id?: string;
  attributes?: {
    label?: string;
    description?: string;
    placeholder?: string;
    value?: string;
    render?: string;
    multiple?: boolean;
    options?: string[] | Array<{ label: string; required?: boolean }>;
  };
  validations?: {
    required?: boolean;
  };
}

/**
 * GitHub Issue Form template structure
 */
interface GitHubIssueForm {
  name?: string;
  description?: string;
  title?: string;
  labels?: string[];
  body?: GitHubIssueFormField[];
}

/**
 * Fetches and parses a GitHub Issue Form YAML template from a URL.
 * @param url - URL to the YAML file
 * @returns Parsed GitHub Issue Form object
 * @throws Error if fetch or parsing fails
 */
export async function fetchGitHubIssueForm(
  url: string,
): Promise<GitHubIssueForm> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GitHub Issue Form template: ${response.status} ${response.statusText}`,
      );
    }

    const yamlText = await response.text();
    const parsed = yaml.load(yamlText) as GitHubIssueForm;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid YAML structure in GitHub Issue Form template");
    }

    return parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Error loading GitHub Issue Form template: ${error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Transforms a GitHub Issue Form field to Wafir FieldConfigApi format.
 * Preserves field IDs, descriptions, types, and validation from the original template.
 * @param field - GitHub Issue Form field
 * @returns Wafir FieldConfigApi object
 */
export function transformGitHubField(
  field: GitHubIssueFormField,
): FieldConfigApi | null {
  // Markdown fields are supported by Wafir
  if (field.type === "markdown") {
    return {
      type: "markdown",
      id: field.id,
      attributes: {
        label: field.attributes?.label,
        value: field.attributes?.value,
      },
      validations: field.validations,
    };
  }

  // Map GitHub field types to Wafir types
  // GitHub supports: input, textarea, dropdown, checkboxes
  // Wafir supports: input, email, textarea, dropdown, checkboxes, markdown, rating
  let wafirType: FieldConfigApi["type"] = field.type;

  // Transform the field
  const wafirField: FieldConfigApi = {
    type: wafirType,
    id: field.id,
    attributes: {
      label: field.attributes?.label,
      description: field.attributes?.description,
      placeholder: field.attributes?.placeholder,
      value: field.attributes?.value,
      render: field.attributes?.render,
      multiple: field.attributes?.multiple,
      options: field.attributes?.options,
    },
    validations: field.validations,
  };

  return wafirField;
}

/**
 * Transforms a GitHub Issue Form template to an array of Wafir FieldConfigApi objects.
 * @param form - GitHub Issue Form template
 * @returns Array of Wafir FieldConfigApi objects
 */
export function transformGitHubIssueForm(
  form: GitHubIssueForm,
): FieldConfigApi[] {
  if (!form.body || !Array.isArray(form.body)) {
    return [];
  }

  return form.body
    .map(transformGitHubField)
    .filter((field): field is FieldConfigApi => field !== null);
}

/**
 * Fetches a GitHub Issue Form template from a URL and transforms it to Wafir fields.
 * @param url - URL to the YAML file
 * @returns Array of Wafir FieldConfigApi objects
 * @throws Error if fetch, parsing, or transformation fails
 */
export async function fetchAndTransformGitHubIssueForm(
  url: string,
): Promise<FieldConfigApi[]> {
  const form = await fetchGitHubIssueForm(url);
  return transformGitHubIssueForm(form);
}
