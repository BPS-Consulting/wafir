import createClient from "openapi-fetch";
import type { paths } from ".";

const DEFAULT_API_URL =
  "https://v6hvmahyx2.execute-api.us-east-2.amazonaws.com";

let currentBridgeUrl = import.meta.env.VITE_WAFIR_API_URL || DEFAULT_API_URL;

export const setBridgeUrl = (url: string) => {
  currentBridgeUrl = url;
};

const getClient = () => {
  return createClient<paths>({
    baseUrl: currentBridgeUrl,
  });
};

export type WafirConfigBase =
  paths["/config/"]["get"]["responses"][200]["content"]["application/json"];

// Extended WafirConfig type with targets array (required for user-hosted configs)
export type WafirConfig = WafirConfigBase & {
  targets: Array<{
    /** Unique identifier for this target, referenced by forms to route submissions. */
    id: string;
    /** Target type using MIME-type convention. Currently supported: github/issues, github/project. */
    type: "github/issues" | "github/project";
    /** Target identifier. Format depends on type: 'owner/repo' for github/issues, 'owner/projectNum' for github/project. */
    target: string;
    /** Authentication reference used to authorize communication with the target. For GitHub types, this is the installation ID. */
    authRef: string;
  }>;
};

// Canonical form and field types from API schema
export type FormConfigApi = NonNullable<WafirConfig["forms"]>[number];
export type FieldConfigApi = NonNullable<FormConfigApi["body"]>[number];

export const checkBridgeHealth = async (
  bridgeUrl?: string,
): Promise<boolean> => {
  const urlToCheck = bridgeUrl || currentBridgeUrl;

  try {
    const response = await fetch(`${urlToCheck}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn("Wafir: Bridge health check failed", error);
    return false;
  }
};

/**
 * @deprecated The widget now fetches config directly from a user-hosted URL.
 * This function is kept for backward compatibility but will be removed in a future version.
 */
export const getWafirConfig = async (
  installationId: number,
  owner: string,
  repo: string,
  bridgeUrl?: string,
): Promise<WafirConfigBase | undefined> => {
  if (bridgeUrl) {
    setBridgeUrl(bridgeUrl);
  }

  const { data, error } = await getClient().GET("/config/", {
    params: {
      query: {
        installationId,
        owner,
        repo,
      },
    },
  });

  if (error) {
    throw new Error("Failed to fetch config");
  }

  return data;
};

export interface SubmitIssueParams {
  /** URL to the authoritative config file - required for server-side validation */
  configUrl: string;
  /** Target type (e.g., github/issues, github/project) */
  targetType: string;
  /** Target identifier (e.g., owner/repo) */
  target: string;
  /** Authentication reference (e.g., installation ID for GitHub) */
  authRef: string;
  title: string;
  /** The form ID for field validation */
  formId?: string;
  labels?: string[];
  screenshot?: Blob;
  bridgeUrl?: string;
  formFields?: Record<string, unknown>;
  fieldOrder?: string[];
  /** Map of field IDs to their display labels */
  fieldLabels?: Record<string, string>;
}

export const submitIssue = async (params: SubmitIssueParams) => {
  const {
    configUrl,
    targetType,
    target,
    authRef,
    title,
    formId,
    labels,
    screenshot,
    bridgeUrl,
    formFields,
    fieldOrder,
    fieldLabels,
  } = params;

  if (bridgeUrl) {
    setBridgeUrl(bridgeUrl);
  }

  const formData = new FormData();
  formData.append("configUrl", configUrl);
  formData.append("targetType", targetType);
  formData.append("target", target);
  formData.append("authRef", authRef);
  formData.append("title", title);
  if (formId) {
    formData.append("formId", formId);
  }
  if (labels) {
    formData.append("labels", JSON.stringify(labels));
  }
  if (screenshot) {
    formData.append("screenshot", screenshot, "screenshot.png");
  }
  if (formFields) {
    formData.append("formFields", JSON.stringify(formFields));
  }
  if (fieldOrder) {
    formData.append("fieldOrder", JSON.stringify(fieldOrder));
  }
  if (fieldLabels) {
    formData.append("fieldLabels", JSON.stringify(fieldLabels));
  }

  const response = await getClient().POST("/submit/", {
    // @ts-expect-error FormData type compatibility with openapi-fetch
    body: formData,
  });

  if (!response.response.ok) {
    const errorData = await response.response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || "Failed to submit issue",
    );
  }

  return response.data;
};
