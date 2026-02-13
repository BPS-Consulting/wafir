/**
 * Options for programmatically opening the Wafir widget.
 */
export interface WafirWidgetOpenOptions {
  /**
   * The tab to open (e.g., "feedback", "suggestion", "issue").
   * If not provided, defaults to the first tab in the configuration.
   */
  tab?: string;

  /**
   * Key-value pairs to prefill form fields in the active tab.
   * Keys must match field IDs defined in the tab's configuration.
   * Unknown field IDs will be ignored and logged as warnings.
   *
   * @example
   * ```ts
   * {
   *   title: "Bug in login",
   *   description: "Cannot log in with OAuth"
   * }
   * ```
   */
  prefill?: Record<string, any>;
}

/**
 * Public API for the Wafir widget.
 * Provides programmatic control for opening the widget with optional prefilled data.
 */
export interface WafirWidgetAPI {
  /**
   * Opens the Wafir widget programmatically.
   *
   * If the widget is already open, this will switch to the specified tab
   * and apply any provided prefill values.
   *
   * If the widget is not yet loaded, the open request will be queued
   * and executed once the widget is ready.
   *
   * @param options - Optional configuration for opening the widget
   * @param options.tab - The tab ID to open (e.g., "feedback", "suggestion", "issue")
   * @param options.prefill - Key-value pairs to prefill form fields
   *
   * @example
   * ```ts
   * // Open the widget on the "suggestion" tab with prefilled fields
   * wafirWidget.open({
   *   tab: "suggestion",
   *   prefill: {
   *     title: "Add dark mode",
   *     description: "Would love a dark theme option"
   *   }
   * });
   * ```
   *
   * @example
   * ```ts
   * // Open the widget on the default tab
   * wafirWidget.open();
   * ```
   */
  open(options?: WafirWidgetOpenOptions): void;
}
