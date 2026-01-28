/**
 * Wafir - Web App Feedback and Issue Reporter
 * 
 * A lightweight feedback and issue reporting widget that seamlessly connects
 * user input to your GitHub-based development workflow.
 * 
 * @packageDocumentation
 */

// Export types
export type { FieldType, FieldConfig } from './types.js';
export type { 
  TabType, 
  TabDefinition, 
  TabConfigs 
} from './default-config.js';

// Export constants
export { 
  DEFAULT_TABS,
  RATING_LABELS,
  DEFAULT_FEEDBACK_FORM,
  DEFAULT_SUGGESTION_FORM,
  DEFAULT_ISSUE_FORM,
  getDefaultFormConfig,
  getDefaultTabConfigs
} from './default-config.js';

// Re-export the main component
export { MyElement as WafirReporter } from './wafir-reporter.js';

// Import TabConfigs for the interface below
import type { TabConfigs } from './default-config.js';

/**
 * Supported widget positions for the trigger button
 */
export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/**
 * Properties for the wafir-reporter custom element
 * 
 * @example
 * ```html
 * <wafir-reporter
 *   installationId="12345678"
 *   owner="your-org"
 *   repo="your-repo"
 *   bridgeUrl="https://your-bridge-url.com"
 * ></wafir-reporter>
 * ```
 */
export interface WafirReporterAttributes {
  /** Text to display on the trigger button */
  buttonText?: string;
  /** Title of the modal dialog (default: "Contact Us") */
  modalTitle?: string;
  /** Position of the trigger button (default: "bottom-right") */
  position?: WidgetPosition;
  /** Tooltip text for the trigger button */
  tooltipText?: string;
  /** Configuration object for custom tab configurations */
  config?: Partial<TabConfigs>;
  /** GitHub App installation ID (required) */
  installationId: number;
  /** GitHub repository owner (required) */
  owner: string;
  /** GitHub repository name (required) */
  repo: string;
  /** URL of the Wafir bridge service */
  bridgeUrl?: string;
}
