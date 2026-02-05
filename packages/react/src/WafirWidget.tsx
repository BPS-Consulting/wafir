import React, { useEffect, useRef } from "react";
import "wafir";

export type WafirPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface WafirWidgetProps {
  /** URL to the wafir configuration file (JSON or YAML). Optional if installationId, owner, and repo are provided. */
  configUrl?: string;
  /** GitHub App installation ID (required if configUrl not provided) */
  installationId?: number;
  /** Repository owner (required if configUrl not provided) */
  owner?: string;
  /** Repository name (required if configUrl not provided) */
  repo?: string;
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
  configUrl?: string;
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
  configUrl,
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
      if (configUrl) ref.current.configUrl = configUrl;
      if (installationId !== undefined)
        ref.current.installationId = installationId;
      if (owner) ref.current.owner = owner;
      if (repo) ref.current.repo = repo;
      if (bridgeUrl) ref.current.bridgeUrl = bridgeUrl;
      if (position) ref.current.position = position;
      if (modalTitle) ref.current.modalTitle = modalTitle;
      if (tooltipText) ref.current.tooltipText = tooltipText;
      if (buttonText) ref.current.buttonText = buttonText;
    }
  }, [
    configUrl,
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
