import createClient from "openapi-fetch";
import type { paths } from ".";

const DEFAULT_API_URL =
  "https://ket5zkk30l.execute-api.us-east-1.amazonaws.com";

let currentBridgeUrl = import.meta.env.VITE_WAFIR_API_URL || DEFAULT_API_URL;

export const setBridgeUrl = (url: string) => {
  currentBridgeUrl = url;
};

const getClient = () => {
  return createClient<paths>({
    baseUrl: currentBridgeUrl,
  });
};

export type WafirConfig =
  paths["/config"]["get"]["responses"][200]["content"]["application/json"];

export const getWafirConfig = async (
  installationId: number,
  owner: string,
  repo: string,
  bridgeUrl?: string
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

export const submitIssue = async (
  installationId: number,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[],
  screenshot?: Blob,
  bridgeUrl?: string
) => {
  if (bridgeUrl) {
    setBridgeUrl(bridgeUrl);
  }

  const formData = new FormData();
  formData.append("installationId", String(installationId));
  formData.append("owner", owner);
  formData.append("repo", repo);
  formData.append("title", title);
  formData.append("body", body);
  if (labels) {
    formData.append("labels", JSON.stringify(labels));
  }
  if (screenshot) {
    formData.append("screenshot", screenshot, "screenshot.png");
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
