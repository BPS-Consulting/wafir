// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
// Content script – runs in the ISOLATED world (cannot touch page scripts directly).
// Responsibilities:
//   1. Check settings; bail out early when extension is disabled or unconfigured.
//   2. Pass settings to the main world via a hidden DOM element.
//   3. Inject the Wafir IIFE bundle and the main-world bridge script.
//   4. Relay bridge messages: page → service worker → page.

import { getSettings } from "../shared/storage.js";
import { BRIDGE_MSG_TYPE, BRIDGE_RSP_TYPE } from "../shared/types.js";
import type { BridgeRequest, BridgeResponse } from "../shared/types.js";

const SETTINGS_ELEMENT_ID = "__wafir_ext_cfg";

async function init() {
  const settings = await getSettings();

  // Do not inject if disabled or missing required config
  if (!settings.enabled) return;
  if (!settings.configUrl) return;

  // Expose settings to the main-world script via a hidden DOM element.
  // We only pass non-sensitive values here; the token stays in the service worker.
  const el = document.createElement("div");
  el.id = SETTINGS_ELEMENT_ID;
  el.style.display = "none";
  el.dataset["configUrl"] = settings.configUrl;
  (document.head ?? document.documentElement).appendChild(el);

  // Inject the Wafir IIFE bundle first (registers <wafir-widget> custom element)
  await injectScript(chrome.runtime.getURL("vendor/wafir.iife.js"));

  // Then inject the bridge + widget-creation script
  injectScript(chrome.runtime.getURL("content/main-world.js"));

  // ── Relay bridge messages page ↔ service-worker ──────────────────────────
  window.addEventListener("message", (event: MessageEvent) => {
    // Only accept messages from the same frame
    if (event.source !== window) return;

    const msg = event.data as BridgeRequest;
    if (!msg || msg.type !== BRIDGE_MSG_TYPE) return;

    chrome.runtime.sendMessage(msg, (response: Partial<BridgeResponse>) => {
      window.postMessage(
        { ...response, type: BRIDGE_RSP_TYPE },
        window.location.origin === "null" ? "*" : window.location.origin,
      );
    });
  });
}

/** Inject a script into the page's main world and return a Promise that resolves on load. */
function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.remove();
      resolve();
    };
    script.onerror = (err) => {
      script.remove();
      reject(err);
    };
    (document.head ?? document.documentElement).appendChild(script);
  });
}

init().catch((err) =>
  console.error("[Wafir Extension] injector failed:", err),
);
