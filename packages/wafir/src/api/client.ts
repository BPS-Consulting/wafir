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
  paths["/config"]["get"]["responses"][200]["content"]["application/json"];

// Extended WafirConfig type that includes installationId (required for user-hosted configs)
export type WafirConfig = WafirConfigBase & {
  /** GitHub App installation ID. Required for authenticating with the GitHub API. */
  installationId: number;
  storage: {
    type: "issue" | "project" | "both";
    /** GitHub repository owner (user or organization) */
    owner: string;
    /** GitHub repository name */
    repo: string;
    projectNumber?: number;
  };
};

// Canonical tab and field types from API schema
export type TabConfigApi = NonNullable<WafirConfig["tabs"]>[number];
export type FieldConfigApi = NonNullable<TabConfigApi["fields"]>[number];

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
) => {
  if (bridgeUrl) {
    setBridgeUrl(bridgeUrl);
  }

  const { data, error } = await getClient().GET("/config", {
    params: {
      query: {
        installationId,
        owner,
        repo,
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to fetch config");
  }

  return data;
};

export interface BrowserInfo {
  url?: string;
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  language?: string;
}

export interface ConsoleLogEntry {
  type: string;
  message: string;
  timestamp: string;
}

export interface SubmitIssueParams {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  labels?: string[];
  screenshot?: Blob;
  bridgeUrl?: string;
  rating?: number;
  submissionType?: "issue" | "feedback";
  formFields?: Record<string, unknown>;
  fieldOrder?: string[];
  browserInfo?: BrowserInfo;
  consoleLogs?: ConsoleLogEntry[];
  // Storage configuration (passed from widget's fetched config)
  storageConfig?: {
    type?: "issue" | "project" | "both";
    projectNumber?: number;
    projectOwner?: string;
  };
  feedbackProjectConfig?: {
    projectNumber?: number;
    owner?: string;
    ratingField?: string;
  };
}

export const submitIssue = async (params: SubmitIssueParams) => {
  const {
    installationId,
    owner,
    repo,
    title,
    labels,
    screenshot,
    bridgeUrl,
    rating,
    submissionType,
    formFields,
    fieldOrder,
    browserInfo,
    consoleLogs,
    storageConfig,
    feedbackProjectConfig,
  } = params;

  if (bridgeUrl) {
    setBridgeUrl(bridgeUrl);
  }

  const formData = new FormData();
  formData.append("installationId", String(installationId));
  formData.append("owner", owner);
  formData.append("repo", repo);
  formData.append("title", title);
  if (labels) {
    formData.append("labels", JSON.stringify(labels));
  }
  if (screenshot) {
    formData.append("screenshot", screenshot, "screenshot.png");
  }
  if (rating !== undefined) {
    formData.append("rating", String(rating));
  }
  if (submissionType) {
    formData.append("submissionType", submissionType);
  }
  if (formFields) {
    formData.append("formFields", JSON.stringify(formFields));
  }
  if (fieldOrder) {
    formData.append("fieldOrder", JSON.stringify(fieldOrder));
  }
  if (browserInfo) {
    formData.append("browserInfo", JSON.stringify(browserInfo));
  }
  if (consoleLogs) {
    formData.append("consoleLogs", JSON.stringify(consoleLogs));
  }
  if (storageConfig) {
    formData.append("storageConfig", JSON.stringify(storageConfig));
  }
  if (feedbackProjectConfig) {
    formData.append(
      "feedbackProjectConfig",
      JSON.stringify(feedbackProjectConfig),
    );
  }

  const response = await getClient().POST("/submit", {
    body: formData as any,
  });

  if (!response.response.ok) {
    const errorData = await response.response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit issue");
  }

  return response.data;
};
