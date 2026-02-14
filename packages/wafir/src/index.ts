import "./wafir-widget.js";
import "./wafir-form.js";
import "./wafir-highlighter.js";
import type { WafirWidget } from "./wafir-widget.js";
import type {
  WafirWidgetAPI,
  WafirWidgetOpenOptions,
} from "./api-interface.js";

// Export types
export type {
  WafirWidgetAPI,
  WafirWidgetOpenOptions,
} from "./api-interface.js";
export type { WafirWidget } from "./wafir-widget.js";

/**
 * Queue for open requests that occur before the widget is ready
 */
let openQueue: WafirWidgetOpenOptions | null = null;

/**
 * Gets the first wafir-widget element from the DOM.
 * @returns The widget element or null if not found
 */
function getWidgetElement(): WafirWidget | null {
  return document.querySelector("wafir-widget");
}

/**
 * Waits for the widget element to be available in the DOM.
 * @param timeout - Maximum time to wait in milliseconds (default: 10000ms)
 * @returns Promise that resolves with the widget element
 */
function waitForWidget(timeout = 10000): Promise<WafirWidget> {
  return new Promise((resolve, reject) => {
    const widget = getWidgetElement();
    if (widget) {
      resolve(widget);
      return;
    }

    const observer = new MutationObserver(() => {
      const widget = getWidgetElement();
      if (widget) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(widget);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Wafir: Widget element not found within timeout"));
    }, timeout);
  });
}

/**
 * Public API instance for programmatic control of the Wafir widget.
 *
 * @example
 * ```ts
 * import { wafirWidget } from "wafir";
 *
 * // Open the widget with prefilled data
 * wafirWidget.open({
 *   tab: "suggestion",
 *   prefill: {
 *     title: "Add dark mode",
 *     description: "Would love a dark theme option"
 *   }
 * });
 * ```
 */
export const wafirWidget: WafirWidgetAPI = {
  open(options?: WafirWidgetOpenOptions): void {
    const widget = getWidgetElement();

    if (widget) {
      // Widget is ready, call open directly
      widget.open(options);
    } else {
      // Widget not ready yet, queue the request and wait
      openQueue = options || {};
      waitForWidget()
        .then((widget) => {
          if (openQueue !== null) {
            widget.open(openQueue);
            openQueue = null;
          }
        })
        .catch((error) => {
          console.error(error.message);
          openQueue = null;
        });
    }
  },
};

/**
 * Expose the API on window for script-tag users
 */
if (typeof window !== "undefined") {
  (window as any).wafirWidget = wafirWidget;
}

// Declare global type augmentation for TypeScript users
declare global {
  interface Window {
    wafirWidget: WafirWidgetAPI;
  }
}
