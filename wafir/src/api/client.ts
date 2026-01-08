import createClient from "openapi-fetch";
import type { paths } from ".";

const DEFAULT_API_URL =
  "https://ket5zkk30l.execute-api.us-east-1.amazonaws.com";

const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_WAFIR_API_URL || DEFAULT_API_URL,
});

export type WafirConfig =
  paths["/config"]["get"]["responses"][200]["content"]["application/json"];

export const getWafirConfig = async (
  installationId: number,
  owner: string,
  repo: string
) => {
  const { data, error } = await apiClient.GET("/config", {
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
  screenshot?: Blob
) => {
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

  const response = await apiClient.POST("/submit", {
    body: formData as any,
  });

  if (!response.response.ok) {
    const errorData = await response.response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit issue");
  }

  return response.data;
};

export default apiClient;
