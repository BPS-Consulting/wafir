// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
// Runs in the PAGE'S MAIN WORLD (injected by injector.ts via a <script> tag).
// Assumes the Wafir IIFE bundle has already been loaded (registers <wafir-widget>).
//
// Responsibilities:
//   1. Intercept fetch calls to the extension's bridge URL and route them via
//      window.postMessage → isolated world → service worker.
//   2. Create the <wafir-widget> element and append it to the page body.
//   3. Inject a screenshot warning near the widget.

(function () {
  "use strict";

  const BRIDGE_URL = "https://wafir-extension.invalid";
  const BRIDGE_MSG_TYPE = "WAFIR_EXT_BRIDGE_REQ";
  const BRIDGE_RSP_TYPE = "WAFIR_EXT_BRIDGE_RSP";
  const SETTINGS_ELEMENT_ID = "__wafir_ext_cfg";

  // ── Read settings injected by the isolated-world content script ─────────────
  const settingsEl = document.getElementById(SETTINGS_ELEMENT_ID);
  const configUrl = settingsEl?.dataset["configUrl"] ?? "";

  // ── Fetch interceptor ────────────────────────────────────────────────────────

  const _originalFetch = window.fetch.bind(window);

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    // Only intercept requests to our synthetic bridge origin.
    // Use origin comparison (not startsWith) to avoid matching subdomains like
    // "https://wafir-extension.invalid.attacker.com".
    let parsedUrl: URL | null = null;
    try {
      parsedUrl = new URL(url);
    } catch {
      return _originalFetch(input, init);
    }
    if (parsedUrl.origin !== BRIDGE_URL) {
      return _originalFetch(input, init);
    }

    const path = parsedUrl.pathname;
    const params: Record<string, string> = Object.fromEntries(
      parsedUrl.searchParams.entries(),
    );
    const method = (init?.method ?? "GET").toUpperCase();

    let body: Record<string, unknown> | undefined;
    if (init?.body instanceof FormData) {
      body = await formDataToObject(init.body);
    } else if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = { raw: init.body };
      }
    }

    const requestId = Math.random().toString(36).slice(2);

    return new Promise<Response>((resolve) => {
      const handler = (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.type !== BRIDGE_RSP_TYPE) return;
        if (data.requestId !== requestId) return;
        window.removeEventListener("message", handler);

        const { status, data: responseData, error } = data;
        if (error && !responseData) {
          resolve(
            new Response(JSON.stringify({ message: error }), {
              status: status ?? 500,
              headers: { "Content-Type": "application/json" },
            }),
          );
        } else {
          resolve(
            new Response(JSON.stringify(responseData), {
              status: status ?? 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      };
      window.addEventListener("message", handler);

      window.postMessage(
        { type: BRIDGE_MSG_TYPE, requestId, path, method, params, body },
        "*",
      );
    });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  async function formDataToObject(
    fd: FormData,
  ): Promise<Record<string, unknown>> {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of fd.entries()) {
      if (value instanceof Blob) {
        obj[key] = {
          __blob: true,
          data: await blobToDataUrl(value),
          name: (value as File).name ?? key,
          type: value.type,
        };
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }

  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  // ── Widget injection ─────────────────────────────────────────────────────────

  function injectWidget() {
    if (document.querySelector("wafir-widget")) return; // already present

    const widget = document.createElement("wafir-widget");
    widget.setAttribute("bridge-url", BRIDGE_URL);
    if (configUrl) {
      widget.setAttribute("config-url", configUrl);
    }
    document.body.appendChild(widget);

    // Screenshot warning – injected as CSS on the custom element.
    // Uses ::after on the host element to display a non-intrusive warning
    // visible while the widget button is present.
    const style = document.createElement("style");
    style.id = "__wafir_ext_warning";
    style.textContent = `
      wafir-widget::after {
        content: '\\26A0\\FE0F  Screenshots may contain sensitive data';
        position: fixed;
        bottom: 76px;
        right: 20px;
        background: #fff8e1;
        color: #7a5c00;
        border: 1px solid #ffe082;
        border-radius: 6px;
        padding: 5px 10px;
        font-size: 11px;
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 230px;
        z-index: 2147483645;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectWidget);
  } else {
    injectWidget();
  }
})();
