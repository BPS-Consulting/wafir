import React, { useEffect, useRef } from "react";
// Import wafir to register the custom element
import "wafir";

export type WafirPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface WafirReporterProps {
  /** Installation ID for the wafir widget */
  installationId: number;
  /** GitHub repository owner */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Widget button position */
  position?: WafirPosition;
  /** Modal title text */
  modalTitle?: string;
  /** Tooltip text for the trigger button */
  tooltipText?: string;
  /** Optional button text (shows instead of icon) */
  buttonText?: string;
}

interface WafirReporterElement extends HTMLElement {
  installationId?: number;
  owner?: string;
  repo?: string;
  position?: string;
  modalTitle?: string;
  tooltipText?: string;
  buttonText?: string;
}

/**
 * React wrapper component for the wafir-reporter web component.
 * Provides a type-safe interface for using the wafir feedback widget in React applications.
 */
export function WafirReporter({
  installationId,
  owner,
  repo,
  position = "bottom-right",
  modalTitle,
  tooltipText,
  buttonText,
}: WafirReporterProps) {
  const ref = useRef<WafirReporterElement>(null);

  // Set properties directly on the element when they change
  useEffect(() => {
    if (ref.current) {
      ref.current.installationId = installationId;
      ref.current.owner = owner;
      ref.current.repo = repo;
      if (position) ref.current.position = position;
      if (modalTitle) ref.current.modalTitle = modalTitle;
      if (tooltipText) ref.current.tooltipText = tooltipText;
      if (buttonText) ref.current.buttonText = buttonText;
    }
  }, [
    installationId,
    owner,
    repo,
    position,
    modalTitle,
    tooltipText,
    buttonText,
  ]);

  // Use createElement to avoid JSX typing issues with custom elements
  return React.createElement("wafir-reporter", { ref });
}

export default WafirReporter;
