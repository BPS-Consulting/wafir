// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import type { ExtensionSettings } from "./types.js";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  githubToken: "",
  configUrl: "",
  imgbbApiKey: "",
};

/** Load extension settings from chrome.storage.sync */
export function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("wafirSettings", (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result["wafirSettings"] ?? {}) });
    });
  });
}

/** Persist extension settings to chrome.storage.sync */
export function saveSettings(
  patch: Partial<ExtensionSettings>,
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("wafirSettings", (result) => {
      const merged = { ...DEFAULT_SETTINGS, ...(result["wafirSettings"] ?? {}), ...patch };
      chrome.storage.sync.set({ wafirSettings: merged }, resolve);
    });
  });
}
