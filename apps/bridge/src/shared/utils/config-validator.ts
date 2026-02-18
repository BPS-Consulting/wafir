import * as yaml from "js-yaml";
import { assertSafeUrl } from "./url-validator.js";

/**
 * Default configuration used when no configUrl is provided.
 * This matches the default configuration from packages/wafir/src/default-config.ts
 */
const DEFAULT_CONFIG: WafirConfig = {
  title: "Contact Us",
  targets: [
    {
      id: "default",
      type: "github/issues",
      target: "",
      authRef: "",
    },
  ],
  telemetry: {
    screenshot: true,
    browserInfo: true,
    consoleLog: false,
  },
  forms: [
    {
      id: "feedback",
      label: "Feedback",
      icon: "thumbsup",
      body: [
        {
          id: "rating",
          type: "rating",
          attributes: {
            label: "How satisfied are you with our website?",
            icon: "⭐",
            options: [
              "Very Unsatisfied",
              "Unsatisfied",
              "Neither satisfied or unsatisfied",
              "Satisfied",
              "Very Satisfied",
            ],
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
      ],
    },
    {
      id: "suggestion",
      label: "Suggestion",
      icon: "lightbulb",
      body: [
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
      ],
    },
    {
      id: "issue",
      label: "Issue",
      icon: "bug",
      body: [
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
      ],
    },
  ],
};

/**
 * Represents a field configuration from the wafir config.
 */
interface FieldConfig {
  type: string;
  id?: string;
  display?: "visible" | "none";
  attributes?: {
    label?: string;
    options?: string[] | Array<{ label: string; required?: boolean }>;
    icon?: string;
  };
  validations?: {
    required?: boolean;
  };
}

/**
 * Represents a form configuration from the wafir config.
 * Forms are displayed as tabs in the widget UI.
 */
interface FormConfig {
  id: string;
  label?: string;
  icon?: string;
  body?: FieldConfig[];
  targets?: string[];
  labels?: string[];
  templateUrl?: string;
}

/**
 * Represents a target destination for form submissions.
 */
export interface TargetConfig {
  id: string;
  type: "github/issues" | "github/project";
  target: string;
  authRef: string;
}

/**
 * Represents the full wafir config structure.
 */
export interface WafirConfig {
  title?: string;
  targets: TargetConfig[];
  telemetry?: {
    screenshot?: boolean;
    browserInfo?: boolean;
    consoleLog?: boolean;
  };
  forms?: FormConfig[];
}

/**
 * Validation error with details about what failed.
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Result of config validation.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  config?: WafirConfig;
}

/**
 * Represents a GitHub Issue Form template structure.
 * Wafir fields use the same schema as GitHub Issue Forms.
 * @see https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema
 */
interface GitHubIssueFormTemplate {
  name?: string;
  description?: string;
  title?: string;
  labels?: string[];
  assignees?: string[];
  body?: FieldConfig[]; // Same schema as Wafir fields
}

/**
 * Fetches a GitHub issue form template from a URL.
 * Since Wafir uses the same field schema as GitHub Issue Forms,
 * the template body can be used directly as fields.
 *
 * @param templateUrl - URL to the GitHub issue form template YAML file (can be relative)
 * @param baseUrl - Base URL to resolve relative templateUrl against
 * @returns Template fields and labels, or undefined if fetch fails
 */
async function fetchGitHubIssueTemplate(
  templateUrl: string,
  baseUrl?: string,
): Promise<{ fields: FieldConfig[]; labels?: string[] } | undefined> {
  try {
    // Resolve relative URLs against the base config URL
    let resolvedUrl = templateUrl;
    if (baseUrl && !templateUrl.startsWith("http://") && !templateUrl.startsWith("https://")) {
      // For relative URLs, resolve against the base URL's directory
      const base = new URL(baseUrl);
      resolvedUrl = new URL(templateUrl, base).toString();
    }

    // SSRF protection: validate URL before fetching
    assertSafeUrl(resolvedUrl);

    const response = await fetch(resolvedUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch template from ${resolvedUrl}: HTTP ${response.status}`,
      );
      return undefined;
    }

    const text = await response.text();
    const template = yaml.load(text) as GitHubIssueFormTemplate;

    if (!template || !template.body || !Array.isArray(template.body)) {
      console.warn(`Invalid template format from ${resolvedUrl}: missing body`);
      return undefined;
    }

    // GitHub Issue Form body uses the same schema as Wafir fields
    return {
      fields: template.body,
      labels: template.labels,
    };
  } catch (error) {
    console.warn(`Error fetching template from ${templateUrl}:`, error);
    return undefined;
  }
}

/**
 * Resolves a template URL, handling both absolute and relative URLs.
 * @param templateUrl - The template URL (can be relative)
 * @param baseUrl - The base URL to resolve against
 * @returns The resolved absolute URL
 */
export function resolveTemplateUrl(templateUrl: string, baseUrl?: string): string {
  if (!baseUrl || templateUrl.startsWith("http://") || templateUrl.startsWith("https://")) {
    return templateUrl;
  }
  const base = new URL(baseUrl);
  return new URL(templateUrl, base).toString();
}

/**
 * Processes forms that have templateUrl, fetching and merging template fields.
 * @param forms - Array of form configurations
 * @param baseUrl - Base URL to resolve relative template URLs against
 * @returns Forms with template fields merged in
 */
async function processFormTemplates(
  forms: FormConfig[] | undefined,
  baseUrl?: string,
): Promise<FormConfig[] | undefined> {
  if (!forms || !Array.isArray(forms)) {
    return forms;
  }

  const processedForms = await Promise.all(
    forms.map(async (form) => {
      // If form has templateUrl and no body defined, fetch from template
      if (form.templateUrl && (!form.body || form.body.length === 0)) {
        const templateData = await fetchGitHubIssueTemplate(form.templateUrl, baseUrl);
        if (templateData) {
          return {
            ...form,
            body: templateData.fields,
            // Merge template labels with form labels (form labels take priority)
            labels: form.labels?.length
              ? form.labels
              : templateData.labels || form.labels,
          };
        }
      }
      return form;
    }),
  );

  return processedForms;
}

/**
 * Fetches and parses a wafir config from a URL.
 * Supports both JSON and YAML formats.
 * If no configUrl is provided, returns the default configuration.
 */
export async function fetchConfig(configUrl?: string): Promise<WafirConfig> {
  // If no configUrl provided, return default config
  if (!configUrl) {
    return DEFAULT_CONFIG;
  }

  // SSRF protection: validate URL before fetching
  assertSafeUrl(configUrl);

  const response = await fetch(configUrl, {
    method: "GET",
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch config: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  let config: unknown;

  // Determine format by content-type or file extension
  if (
    contentType.includes("application/json") ||
    (!contentType.includes("yaml") &&
      !configUrl.endsWith(".yaml") &&
      !configUrl.endsWith(".yml"))
  ) {
    try {
      config = JSON.parse(text);
    } catch {
      // Try YAML as fallback
      config = yaml.load(text);
    }
  } else {
    config = yaml.load(text);
  }

  // Basic structure validation
  if (!config || typeof config !== "object") {
    throw new Error("Invalid config: must be an object");
  }

  const cfg = config as Record<string, unknown>;

  if (!cfg.targets || !Array.isArray(cfg.targets) || cfg.targets.length === 0) {
    throw new Error(
      "Invalid config: targets must be a non-empty array of target configurations",
    );
  }

  // Validate each target
  const targets = cfg.targets as unknown[];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    if (!target || typeof target !== "object") {
      throw new Error(`Invalid config: targets[${i}] must be an object`);
    }

    const t = target as Record<string, unknown>;
    if (typeof t.id !== "string" || t.id.trim() === "") {
      throw new Error(
        `Invalid config: targets[${i}].id must be a non-empty string`,
      );
    }
    if (
      typeof t.type !== "string" ||
      !["github/issues", "github/project"].includes(t.type)
    ) {
      throw new Error(
        `Invalid config: targets[${i}].type must be "github/issues" or "github/project"`,
      );
    }
    if (typeof t.target !== "string" || t.target.trim() === "") {
      throw new Error(
        `Invalid config: targets[${i}].target must be a non-empty string`,
      );
    }
    if (typeof t.authRef !== "string" || t.authRef.trim() === "") {
      throw new Error(
        `Invalid config: targets[${i}].authRef must be a non-empty string`,
      );
    }
  }

  // Validate that target IDs are unique
  const targetIds = new Set<string>();
  for (const target of targets as Array<{ id: string }>) {
    if (targetIds.has(target.id)) {
      throw new Error(
        `Invalid config: duplicate target ID "${target.id}" found`,
      );
    }
    targetIds.add(target.id);
  }

  // Validate form targets reference valid target IDs
  if (cfg.forms && Array.isArray(cfg.forms)) {
    const forms = cfg.forms as unknown[];
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (form && typeof form === "object") {
        const f = form as Record<string, unknown>;
        if (f.targets && Array.isArray(f.targets)) {
          for (const targetId of f.targets as unknown[]) {
            if (typeof targetId !== "string") {
              throw new Error(
                `Invalid config: forms[${i}].targets must contain only strings`,
              );
            }
            if (!targetIds.has(targetId)) {
              throw new Error(
                `Invalid config: forms[${i}].targets references unknown target ID "${targetId}"`,
              );
            }
          }
        }
      }
    }
  }

  // Process forms with templateUrl - fetch and merge template fields
  if (cfg.forms && Array.isArray(cfg.forms)) {
    cfg.forms = await processFormTemplates(cfg.forms as FormConfig[], configUrl);
  }

  return config as WafirConfig;
}

/**
 * Validates that submitted target values match a configured target.
 * Returns the matched target config if valid.
 */
export function validateTargetMatch(
  submittedTargetType: string,
  submittedTarget: string,
  submittedAuthRef: string,
  authoritativeConfig: WafirConfig,
): ValidationResult & { target?: TargetConfig } {
  const errors: ValidationError[] = [];

  // Find a matching target in the config
  const matchedTarget = authoritativeConfig.targets.find(
    (t) =>
      t.type === submittedTargetType &&
      t.target === submittedTarget &&
      t.authRef === submittedAuthRef,
  );

  if (!matchedTarget) {
    errors.push({
      code: "TARGET_MISMATCH",
      message: `No matching target found in config for type="${submittedTargetType}", target="${submittedTarget}", authRef="${submittedAuthRef}"`,
      field: "target",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    config: authoritativeConfig,
    target: matchedTarget,
  };
}

/**
 * Gets the allowed field IDs for a specific form from the config.
 * Only returns fields explicitly defined in the form configuration.
 * If no form is found or no fields are defined, returns an empty set.
 */
function getAllowedFieldIds(config: WafirConfig, formId?: string): Set<string> {
  const allowedFields = new Set<string>();

  // If no formId provided, cannot determine allowed fields
  if (!formId) {
    return allowedFields;
  }

  // Find the form in config
  const form = config.forms?.find((f) => f.id === formId);

  // Only use fields explicitly defined in the form configuration
  if (form?.body && form.body.length > 0) {
    for (const field of form.body) {
      if (field.id) {
        allowedFields.add(field.id);
      }
    }
  }

  return allowedFields;
}

/**
 * Gets required field IDs for a specific form from the config.
 * Only returns fields marked as required in the form configuration.
 */
function getRequiredFieldIds(config: WafirConfig, formId?: string): Set<string> {
  const requiredFields = new Set<string>();

  // If no formId provided, cannot determine required fields
  if (!formId) {
    return requiredFields;
  }

  const form = config.forms?.find((f) => f.id === formId);

  // Only use fields explicitly marked as required in the form configuration
  if (form?.body) {
    for (const field of form.body) {
      if (field.id && field.validations?.required) {
        requiredFields.add(field.id);
      }
    }
  }

  return requiredFields;
}

/**
 * Gets field configuration by ID for validation purposes.
 */
function getFieldConfig(
  config: WafirConfig,
  formId: string | undefined,
  fieldId: string,
): FieldConfig | undefined {
  const form = config.forms?.find((f) => f.id === formId);
  return form?.body?.find((f) => f.id === fieldId);
}

/**
 * Validates a single field value against its configuration.
 */
function validateFieldValue(
  fieldId: string,
  value: unknown,
  fieldConfig: FieldConfig | undefined,
): ValidationError | null {
  // Skip validation for fields without config (use defaults)
  if (!fieldConfig) {
    return null;
  }

  const fieldType = fieldConfig.type;

  switch (fieldType) {
    case "input":
    case "textarea":
    case "email":
      if (value !== undefined && value !== null && typeof value !== "string") {
        return {
          code: "INVALID_FIELD_TYPE",
          message: `Field "${fieldId}" must be a string`,
          field: fieldId,
        };
      }
      if (
        fieldType === "email" &&
        typeof value === "string" &&
        value.length > 0
      ) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return {
            code: "INVALID_EMAIL",
            message: `Field "${fieldId}" must be a valid email address`,
            field: fieldId,
          };
        }
      }
      break;

    case "rating":
      if (value !== undefined && value !== null) {
        // Determine max rating from options array, default to 5
        const ratingOptions = fieldConfig.attributes?.options;
        const maxRating = Array.isArray(ratingOptions) && ratingOptions.length > 0 ? ratingOptions.length : 5;
        
        // Allow 0 to represent no rating selected
        if (typeof value !== "number" || value < 0 || value > maxRating) {
          return {
            code: "INVALID_RATING",
            message: `Field "${fieldId}" must be a number between 0 and ${maxRating}`,
            field: fieldId,
          };
        }
      }
      break;

    case "dropdown":
      if (value !== undefined && value !== null) {
        const options = fieldConfig.attributes?.options;
        if (Array.isArray(options) && options.length > 0) {
          // Dropdown options can be strings
          const validOptions = options.map((opt) =>
            typeof opt === "string" ? opt : (opt as { label: string }).label,
          );
          const submittedValues = Array.isArray(value) ? value : [value];
          for (const v of submittedValues) {
            if (!validOptions.includes(String(v))) {
              return {
                code: "INVALID_DROPDOWN_VALUE",
                message: `Field "${fieldId}" contains invalid option: "${v}"`,
                field: fieldId,
              };
            }
          }
        }
      }
      break;

    case "checkboxes":
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          return {
            code: "INVALID_CHECKBOXES_TYPE",
            message: `Field "${fieldId}" must be an array`,
            field: fieldId,
          };
        }
        const options = fieldConfig.attributes?.options;
        if (Array.isArray(options) && options.length > 0) {
          const validLabels = options.map((opt) =>
            typeof opt === "string" ? opt : (opt as { label: string }).label,
          );
          for (const v of value) {
            if (!validLabels.includes(String(v))) {
              return {
                code: "INVALID_CHECKBOX_VALUE",
                message: `Field "${fieldId}" contains invalid option: "${v}"`,
                field: fieldId,
              };
            }
          }
        }
      }
      break;

    case "markdown":
      // Markdown fields are display-only, should not be submitted
      if (value !== undefined && value !== null) {
        return {
          code: "UNEXPECTED_MARKDOWN_VALUE",
          message: `Field "${fieldId}" is a markdown display field and should not be submitted`,
          field: fieldId,
        };
      }
      break;
  }

  return null;
}

/**
 * Validates form fields against the config.
 * - Rejects extra fields not defined in config
 * - Validates required fields are present
 * - Validates field types and values
 */
export function validateFormFields(
  formFields: Record<string, unknown>,
  config: WafirConfig,
  formId?: string,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate that formId is provided
  if (!formId) {
    errors.push({
      code: "MISSING_FORM_ID",
      message: "Form ID is required for validation",
    });
    return {
      valid: false,
      errors,
      config,
    };
  }

  // Validate that the form exists in config
  const form = config.forms?.find((f) => f.id === formId);
  if (!form) {
    errors.push({
      code: "UNKNOWN_FORM",
      message: `Form "${formId}" not found in config`,
      field: "formId",
    });
    return {
      valid: false,
      errors,
      config,
    };
  }

  const allowedFields = getAllowedFieldIds(config, formId);
  const requiredFields = getRequiredFieldIds(config, formId);

  // Check for extra fields not in config
  for (const fieldId of Object.keys(formFields)) {
    if (!allowedFields.has(fieldId)) {
      errors.push({
        code: "UNKNOWN_FIELD",
        message: `Field "${fieldId}" is not allowed for form "${formId || "default"}"`,
        field: fieldId,
      });
    }
  }

  // Check for missing required fields
  for (const requiredField of requiredFields) {
    const value = formFields[requiredField];
    if (value === undefined || value === null || value === "") {
      errors.push({
        code: "MISSING_REQUIRED_FIELD",
        message: `Required field "${requiredField}" is missing or empty`,
        field: requiredField,
      });
    }
  }

  // Validate individual field values
  for (const [fieldId, value] of Object.entries(formFields)) {
    // Skip validation for unknown fields (already caught above)
    if (!allowedFields.has(fieldId)) continue;

    const fieldConfig = getFieldConfig(config, formId, fieldId);
    const fieldError = validateFieldValue(fieldId, value, fieldConfig);
    if (fieldError) {
      errors.push(fieldError);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    config,
  };
}

/**
 * Validates that the configUrl is from the same origin as the request.
 * This prevents SSRF attacks and ensures config integrity.
 */
export function validateSameOrigin(
  configUrl: string,
  requestOrigin: string,
): ValidationResult {
  try {
    const configUrlObj = new URL(configUrl);
    const requestOriginObj = new URL(requestOrigin);

    // Compare protocol, hostname, and port
    if (
      configUrlObj.protocol !== requestOriginObj.protocol ||
      configUrlObj.hostname !== requestOriginObj.hostname ||
      configUrlObj.port !== requestOriginObj.port
    ) {
      return {
        valid: false,
        errors: [
          {
            code: "ORIGIN_MISMATCH",
            message: `Config URL origin (${configUrlObj.origin}) does not match request origin (${requestOriginObj.origin}). For security, config must be hosted on the same domain as the form.`,
          },
        ],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid URL";
    return {
      valid: false,
      errors: [
        {
          code: "INVALID_URL",
          message: `Failed to parse URLs: ${message}`,
        },
      ],
    };
  }
}

/**
 * Full validation: fetches config and validates both target match and form fields.
 * If no configUrl is provided, uses the default configuration merged with submitted values.
 */
export async function validateSubmission(params: {
  configUrl?: string;
  targetType?: string;
  target?: string;
  authRef?: string;
  formFields: Record<string, unknown>;
  formId?: string;
  requestOrigin?: string;
}): Promise<ValidationResult & { matchedTarget?: TargetConfig }> {
  const {
    configUrl,
    targetType,
    target,
    authRef,
    formFields,
    formId,
    requestOrigin,
  } = params;

  // Validate same-origin if requestOrigin is provided and configUrl exists
  if (requestOrigin && configUrl) {
    const originResult = validateSameOrigin(configUrl, requestOrigin);
    if (!originResult.valid) {
      return originResult;
    }
  }

  // Fetch authoritative config (or use default if no configUrl)
  let config: WafirConfig;
  try {
    config = await fetchConfig(configUrl);

    // If no configUrl was provided, merge the submitted values with default config
    // This allows users to specify target details directly on the widget
    if (!configUrl && targetType && target && authRef) {
      config = {
        ...config,
        targets: [
          {
            id: "widget-default",
            type: targetType as "github/issues" | "github/project",
            target: target,
            authRef: authRef,
          },
        ],
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      valid: false,
      errors: [
        {
          code: "CONFIG_FETCH_FAILED",
          message: `Failed to fetch config from ${configUrl}: ${message}`,
        },
      ],
    };
  }

  // Validate target match if provided
  let matchedTarget: TargetConfig | undefined;
  if (targetType && target && authRef) {
    const targetMatchResult = validateTargetMatch(
      targetType,
      target,
      authRef,
      config,
    );
    if (!targetMatchResult.valid) {
      return targetMatchResult;
    }
    matchedTarget = targetMatchResult.target;
  }

  // Validate form fields
  const formFieldsResult = validateFormFields(formFields, config, formId);
  if (!formFieldsResult.valid) {
    return formFieldsResult;
  }

  return {
    valid: true,
    errors: [],
    config,
    matchedTarget,
  };
}
