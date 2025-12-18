import createClient from "openapi-fetch";
import type { paths } from ".";

const apiClient = createClient<paths>({ baseUrl: "http://localhost:3000" });

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
  labels?: string[]
) => {
  const { data, error } = await apiClient.POST("/submit", {
    body: {
      installationId,
      owner,
      repo,
      title,
      body,
      labels,
    },
  });

  if (error) {
    throw new Error("Failed to submit issue");
  }

  return data;
};

export const getUploadUrl = async (contentType: string) => {
  const { data, error } = await apiClient.GET("/upload-url", {
    params: {
      query: {
        contentType,
      },
    },
  });

  if (error) {
    throw new Error("Failed to get upload URL");
  }

  return data;
};

export default apiClient;
