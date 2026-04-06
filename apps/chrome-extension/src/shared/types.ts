// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3

/** Extension settings stored in chrome.storage.sync */
export interface ExtensionSettings {
  /** Whether the widget is currently enabled (injected into pages) */
  enabled: boolean;
  /** GitHub Personal Access Token with `repo` scope */
  githubToken: string;
  /** HTTPS URL to a wafir YAML or JSON config file */
  configUrl: string;
  /** ImgBB API key - screenshots uploaded via ImgBB expire after 5 minutes */
  imgbbApiKey: string;
}

/** Special bridge URL intercepted by the main-world script */
export const EXTENSION_BRIDGE_URL = "https://wafir-extension.invalid";

/** postMessage / chrome.runtime.sendMessage type identifier */
export const BRIDGE_MSG_TYPE = "WAFIR_EXT_BRIDGE_REQ";
export const BRIDGE_RSP_TYPE = "WAFIR_EXT_BRIDGE_RSP";

/** Message sent from main-world → isolated content-script → service-worker */
export interface BridgeRequest {
  type: typeof BRIDGE_MSG_TYPE;
  requestId: string;
  path: string;
  method: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

/** Message sent back from service-worker → isolated → main-world */
export interface BridgeResponse {
  type: typeof BRIDGE_RSP_TYPE;
  requestId: string;
  status: number;
  data?: unknown;
  error?: string;
}
