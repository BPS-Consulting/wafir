import { atom } from "nanostores";
import type { BrowserInfo, ConsoleLog } from "./utils/telemetry";

export const isSelecting = atom(false);
export const isCapturing = atom(false);
export const capturedImage = atom<string | null>(null);
export const hoveredElement = atom<HTMLElement | null>(null);
export const formData = atom<Record<string, Record<string, any>>>({});
export const browserInfo = atom<BrowserInfo | null>(null);
export const consoleLogs = atom<ConsoleLog[]>([]);

export const startSelection = () => {
  isSelecting.set(true);
};

export const stopSelection = () => {
  isSelecting.set(false);
  hoveredElement.set(null);
};

export const setCapturedImage = (image: string | null) => {
  capturedImage.set(image);
};

export const getTabFormData = (tabId: string): Record<string, any> => {
  return formData.get()[tabId] || {};
};

export const setTabFormData = (tabId: string, data: Record<string, any>) => {
  formData.set({ ...formData.get(), [tabId]: data });
};

export const clearTabFormData = (tabId: string) => {
  const current = formData.get();
  const updated = { ...current };
  delete updated[tabId];
  formData.set(updated);
};

export const setBrowserInfo = (info: BrowserInfo | null) => {
  browserInfo.set(info);
};

export const setConsoleLogs = (logs: ConsoleLog[]) => {
  consoleLogs.set(logs);
};

export const resetState = () => {
  formData.set({});
  capturedImage.set(null);
  isSelecting.set(false);
  isCapturing.set(false);
  hoveredElement.set(null);
  browserInfo.set(null);
  consoleLogs.set([]);
};
