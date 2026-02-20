import { atom } from "nanostores";
import type { BrowserInfo, ConsoleLog } from "./utils/telemetry";

export const isSelecting = atom(false);
export const isCapturing = atom(false);
export const capturedImage = atom<string | null>(null);
export const hoveredElement = atom<HTMLElement | null>(null);
export const formData = atom<Record<string, Record<string, any>>>({});
export const browserInfo = atom<BrowserInfo | null>(null);
export const consoleLogs = atom<ConsoleLog[]>([]);

// Per-form state management for screenshots and autofill checkboxes
export const formScreenshots = atom<Record<string, string | null>>({});
export const formAutofillEnabled = atom<
  Record<string, Record<string, boolean>>
>({});
export const currentFormId = atom<string>("feedback");

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

export const getFormScreenshot = (formId: string): string | null => {
  return formScreenshots.get()[formId] || null;
};

export const setFormScreenshot = (formId: string, image: string | null) => {
  formScreenshots.set({ ...formScreenshots.get(), [formId]: image });
};

export const getFormAutofillEnabled = (
  formId: string,
): Record<string, boolean> => {
  return formAutofillEnabled.get()[formId] || {};
};

export const setFormAutofillEnabled = (
  formId: string,
  fieldId: string,
  enabled: boolean,
) => {
  const current = formAutofillEnabled.get();
  const formAutofill = current[formId] || {};
  formAutofillEnabled.set({
    ...current,
    [formId]: { ...formAutofill, [fieldId]: enabled },
  });
};

export const getCurrentFormId = (): string => {
  return currentFormId.get();
};

export const setCurrentFormId = (formId: string) => {
  currentFormId.set(formId);
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

  // Also clear screenshot and autofill state for this form
  const screenshots = formScreenshots.get();
  const updatedScreenshots = { ...screenshots };
  delete updatedScreenshots[tabId];
  formScreenshots.set(updatedScreenshots);

  const autofill = formAutofillEnabled.get();
  const updatedAutofill = { ...autofill };
  delete updatedAutofill[tabId];
  formAutofillEnabled.set(updatedAutofill);
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
  formScreenshots.set({});
  formAutofillEnabled.set({});
  isSelecting.set(false);
  isCapturing.set(false);
  hoveredElement.set(null);
  browserInfo.set(null);
  consoleLogs.set([]);
  currentFormId.set("feedback");
};
