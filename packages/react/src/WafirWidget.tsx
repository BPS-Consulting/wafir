import React, { useEffect, useRef } from "react";
import "wafir";

export type WafirPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface WafirWidgetProps {
  /** Installation ID for the wafir widget */
  installationId: number;
  /** GitHub repository owner */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Custom bridge server URL (for self-hosted bridge) */
  bridgeUrl?: string;
  /** Widget button position */
  position?: WafirPosition;
  /** Modal title text */
  modalTitle?: string;
  /** Tooltip text for the trigger button */
  tooltipText?: string;
  /** Optional button text (shows instead of icon) */
  buttonText?: string;
  /** Custom trigger element (replaces default button) */
  children?: React.ReactNode;
}

interface WafirWidgetElement extends HTMLElement {
  installationId?: number;
  owner?: string;
  repo?: string;
  bridgeUrl?: string;
  position?: string;
  modalTitle?: string;
  tooltipText?: string;
  buttonText?: string;
}

/**
 * React wrapper component for the wafir-widget web component.
 * Provides a type-safe interface for using the wafir feedback widget in React applications.
 */
export function WafirWidget({
  installationId,
  owner,
  repo,
  bridgeUrl,
  position = "bottom-right",
  modalTitle,
  tooltipText,
  buttonText,
  children,
}: WafirWidgetProps) {
  const ref = useRef<WafirWidgetElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.installationId = installationId;
      ref.current.owner = owner;
      ref.current.repo = repo;
      if (bridgeUrl) ref.current.bridgeUrl = bridgeUrl;
      if (position) ref.current.position = position;
      if (modalTitle) ref.current.modalTitle = modalTitle;
      if (tooltipText) ref.current.tooltipText = tooltipText;
      if (buttonText) ref.current.buttonText = buttonText;
    }
  }, [
    installationId,
    owner,
    repo,
    bridgeUrl,
    position,
    modalTitle,
    tooltipText,
    buttonText,
  ]);

  return React.createElement(
    "wafir-widget",
    { ref },
    children ? React.createElement("div", { slot: "trigger" }, children) : null,
  );
}

export default WafirWidget;
