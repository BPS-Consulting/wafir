import { atom } from "nanostores";

export const isSelecting = atom(false);
export const isCapturing = atom(false);
export const capturedImage = atom<string | null>(null);
export const hoveredElement = atom<HTMLElement | null>(null);

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
