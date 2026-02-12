import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import widgetStyles from "./styles/wafir-widget.css?inline";
import bugIcon from "./assets/bug.svg?raw";
import thumbsupIcon from "./assets/thumbsup.svg?raw";
import lightbulbIcon from "./assets/lightbulb.svg?raw";
import "./wafir-form";
import "./wafir-highlighter";
import {
  isSelecting,
  isCapturing,
  capturedImage,
  resetState,
  setBrowserInfo,
  setConsoleLogs,
  browserInfo,
  consoleLogs,
} from "./store.js";
import { StoreController } from "@nanostores/lit";
import type {
  TabConfigApi as TabConfig,
  FieldConfigApi as FieldConfig,
  WafirConfig,
} from "./api/client.js";
import { dataURLtoBlob } from "./utils/file.js";
import { getBrowserInfo, consoleInterceptor } from "./utils/telemetry.js";
import {
  getDefaultTabs,
  getDefaultFields,
  getDefaultConfig,
} from "./default-config.js";

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const TAB_ICONS: Record<string, string> = {
  thumbsup: thumbsupIcon,
  lightbulb: lightbulbIcon,
  bug: bugIcon,
};

@customElement("wafir-widget")
export class WafirWidget extends LitElement {
  @property({ type: String })
  buttonText = "";

  @property({ type: String })
  modalTitle = "Contact Us";

  @property({ type: String })
  position: WidgetPosition = "bottom-right";

  @property({ type: String })
  tooltipText = "Open Issue Widget";

  @property({ type: Array })
  tabs: TabConfig[] = [];

  private _isSelectingController = new StoreController(this, isSelecting);
  private _isCapturingController = new StoreController(this, isCapturing);
  private _capturedImageController = new StoreController(this, capturedImage);

  @state()
  isModalOpen = false;

  @state()
  isConfigLoading = false;

  @state()
  configFetchError: string | null = null;

  @state()
  isBridgeAvailable = true;

  @state()
  private _hasCustomTrigger = false;

  @state()
  private _tabs: TabConfig[] = getDefaultTabs();

  @state()
  private _activeTabId: string = "feedback";

  @state()
  private _telemetry = {
    screenshot: true,
    browserInfo: true,
    consoleLog: false,
  };

  static styles = [unsafeCSS(widgetStyles)];

  connectedCallback() {
    super.connectedCallback();
    this._checkCustomTrigger();
    this._mergeInlineTabs();
  }

  private _checkCustomTrigger() {
    this._hasCustomTrigger = this.querySelector('[slot="trigger"]') !== null;
  }

  private _mergeInlineTabs() {
    if (this.tabs && this.tabs.length > 0) {
      this._tabs = this.tabs.map((tab) => ({
        ...tab,
        fields:
          tab.fields && tab.fields.length > 0
            ? tab.fields
            : getDefaultFields(tab.id),
      }));
      if (this._tabs.length > 0) {
        this._activeTabId = this._tabs[0].id;
      }
    }
  }

  public openModal() {
    if (!this.isModalOpen) {
      this._openModal();
    }
  }

  private async _openModal() {
    this.isModalOpen = true;
    setBrowserInfo(getBrowserInfo());
    setConsoleLogs(consoleInterceptor.getLogs());
    await this._checkBridgeHealth();
    await this._fetchConfig();
  }

  private async _handleTriggerClick() {
    if (this.isModalOpen) {
      this._closeModal();
    } else {
      await this._openModal();
    }
  }

  private async _checkBridgeHealth() {
    try {
      const { checkBridgeHealth } = await import("./api/client.js");
      this.isBridgeAvailable = await checkBridgeHealth(
        this.bridgeUrl || undefined,
      );

      if (!this.isBridgeAvailable) {
        console.warn("Wafir: Bridge service is not available");
      }
    } catch (error) {
      console.warn("Wafir: Failed to check bridge health", error);
      this.isBridgeAvailable = false;
    }
  }

  private _resolveConfigUrl(configUrl: string): string {
    // If the URL starts with http:// or https://, use it as-is
    if (configUrl.startsWith("http://") || configUrl.startsWith("https://")) {
      return configUrl;
    }

    // Otherwise, resolve relative to current origin (like anchor tags)
    const baseUrl = window.location.origin;
    const url = new URL(configUrl, baseUrl);
    return url.href;
  }

  private async _fetchConfig() {
    if (!this.configUrl) {
      console.warn("Wafir: No configUrl provided, using default configuration");
      const defaultConfig = getDefaultConfig();

      // Merge direct widget properties with default config
      this._config = {
        ...defaultConfig,
        targets:
          this.owner && this.repo
            ? [
                {
                  id: "default",
                  type: "github/issues",
                  target: `${this.owner}/${this.repo}`,
                  authRef: "0",
                },
              ]
            : defaultConfig.targets,
      };

      this._applyConfig(this._config);
      return;
    }

    this.isConfigLoading = true;
    this.configFetchError = null;

    try {
      // Resolve relative URLs to same origin
      const resolvedUrl = this._resolveConfigUrl(this.configUrl);

      const response = await fetch(resolvedUrl, {
        method: "GET",
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let config: WafirConfig;

      if (
        contentType.includes("yaml") ||
        contentType.includes("x-yaml") ||
        resolvedUrl.endsWith(".yaml") ||
        resolvedUrl.endsWith(".yml")
      ) {
        // Parse YAML
        const yamlText = await response.text();
        const yaml = await import("js-yaml");
        config = yaml.load(yamlText) as WafirConfig;
      } else {
        // Parse JSON
        config = await response.json();
      }

      // Validate required fields
      if (!config.targets || config.targets.length === 0) {
        console.warn(
          "Wafir: Config missing required fields (targets), using defaults",
          config,
        );
        this._config = getDefaultConfig();
        this._applyConfig(this._config);
        return;
      }

      this._config = config;
      this._applyConfig(config);
    } catch (error) {
      console.error("Wafir: Failed to fetch remote config, using defaults", {
        error,
        configUrl: this.configUrl,
      });
      this._config = getDefaultConfig();
      this._applyConfig(this._config);
    } finally {
      this.isConfigLoading = false;
    }
  }

  private _applyConfig(config: WafirConfig) {
    if (config.tabs && Array.isArray(config.tabs)) {
      this._tabs = config.tabs.map((tab: TabConfig) => ({
        id: tab.id,
        label: tab.label || this._capitalize(tab.id),
        icon: tab.icon,
        isFeedback: tab.isFeedback ?? false,
        fields:
          tab.fields && tab.fields.length > 0
            ? tab.fields
            : getDefaultFields(tab.id),
      }));
      if (this._tabs.length > 0) {
        this._activeTabId = this._tabs[0].id;
      }
    } else {
      console.warn("Wafir: No tabs in config or tabs is not an array");
    }

    if (config.title) {
      this.modalTitle = config.title;
    }

    if (config.telemetry) {
      this._telemetry = {
        screenshot: config.telemetry.screenshot ?? true,
        browserInfo: config.telemetry.browserInfo ?? true,
        consoleLog: config.telemetry.consoleLog ?? false,
      };
    }
  }

  private _capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private _closeModal() {
    this.isModalOpen = false;
    resetState();
  }

  private _getActiveTab(): TabConfig | undefined {
    return this._tabs.find((t) => t.id === this._activeTabId);
  }

  private _getActiveFormConfig(): FieldConfig[] {
    const tab = this._getActiveTab();
    const fields = tab?.fields || [];
    return fields;
  }

  private _switchTab(tabId: string) {
    this._activeTabId = tabId;
  }

  @property({ type: String })
  configUrl = "";

  @property({ type: String })
  bridgeUrl = "";

  @property({ type: String })
  owner = "";

  @property({ type: String })
  repo = "";

  @state()
  private _config: WafirConfig | null = null;

  private async _handleSubmit(event: CustomEvent) {
    const formData = event.detail.formData as Record<string, unknown>;
    const activeTab = this._getActiveTab();

    if (
      !this._config ||
      !this._config.targets ||
      this._config.targets.length === 0
    ) {
      console.error("Wafir: Missing configuration (targets)");
      alert("Widget configuration error");
      return;
    }

    const { targets } = this._config;

    // Find the target for the active tab
    // If tab has targets specified, use the first one for validation
    // If tab has no targets specified, backend will route to all targets
    const activeTabTargets = activeTab?.targets;
    let targetConfig = targets[0]; // Default to first target

    if (activeTabTargets && activeTabTargets.length > 0) {
      // Use the first target specified for this tab
      const targetId = activeTabTargets[0];
      const foundTarget = targets.find(
        (t: { id: string }) => t.id === targetId,
      );
      if (foundTarget) {
        targetConfig = foundTarget;
      } else {
        console.error(
          `Wafir: Tab "${activeTab.id}" references unknown target "${targetId}". Available targets: ${targets.map((t) => t.id).join(", ")}`,
        );
        alert("Widget configuration error: Invalid target reference");
        return;
      }
    }

    // Parse owner/repo from target string (format: owner/repo)
    const targetParts = targetConfig.target.split("/");
    const owner = targetParts[0] || "";
    const repo = targetParts[1] || "";

    if (!owner || !repo) {
      console.error(
        "Wafir: Invalid target format. Expected 'owner/repo', got:",
        targetConfig.target,
      );
      alert("Widget configuration error");
      return;
    }

    try {
      const title =
        (formData.title as string) || activeTab?.label || "Submission";
      const labels: string[] = [this._activeTabId];

      const { submitIssue } = await import("./api/client.js");

      const screenshotDataUrl = this._capturedImageController.value;
      const screenshotBlob = screenshotDataUrl
        ? dataURLtoBlob(screenshotDataUrl)
        : undefined;

      const isFeedbackTab = activeTab?.isFeedback ?? false;
      const submissionType: "issue" | "feedback" = isFeedbackTab
        ? "feedback"
        : "issue";
      const rating = isFeedbackTab
        ? Number(formData.rating) || undefined
        : undefined;

      // Filter out markdown fields before submission
      const activeFields = this._getActiveFormConfig();
      const submitFields = activeFields.filter((f) => f.type !== "markdown");
      const fieldOrder = submitFields.map((f) => String(f.id));

      // Only send user-data fields in formFields
      const filteredFormData: Record<string, unknown> = {};
      for (const field of submitFields) {
        const id = String(field.id);
        if (formData[id] !== undefined) filteredFormData[id] = formData[id];
      }

      // Always send the resolved absolute URL to the backend
      const resolvedConfigUrl = this.configUrl
        ? this._resolveConfigUrl(this.configUrl)
        : "";

      // Note: We send one target for validation, but the backend will determine
      // which targets to actually submit to based on the tab's targets array in the config.
      // If the tab has no targets specified, the backend will route to all configured targets.
      await submitIssue({
        configUrl: resolvedConfigUrl,
        targetType: targetConfig.type,
        target: targetConfig.target,
        authRef: targetConfig.authRef,
        title,
        tabId: this._activeTabId,
        labels,
        screenshot: screenshotBlob,
        bridgeUrl: this.bridgeUrl || undefined,
        rating,
        submissionType,
        formFields: filteredFormData,
        fieldOrder,
        browserInfo: this._telemetry.browserInfo
          ? (browserInfo.get() ?? undefined)
          : undefined,
        consoleLogs: this._telemetry.consoleLog ? consoleLogs.get() : undefined,
      });

      alert("Thank you for your input!");
      resetState();
      this.isModalOpen = false;
    } catch (error) {
      console.error("Wafir: Submit failed", error);
      alert("Failed to submit. Please check configuration.");
    }
  }

  private _renderTabIcon(iconName: string | undefined) {
    if (!iconName) return "";
    return unsafeHTML(TAB_ICONS[iconName] || "");
  }

  render() {
    if (this._isCapturingController.value) {
      return html``;
    }

    if (this._isSelectingController.value) {
      return html`<wafir-highlighter></wafir-highlighter>`;
    }

    return html`
      ${this._hasCustomTrigger
        ? html`<div
            class="trigger-container ${this.position}"
            @click="${this._handleTriggerClick}"
          >
            <slot name="trigger"></slot>
          </div>`
        : html`
            <div class="trigger-container ${this.position}">
              <button
                @click="${this._handleTriggerClick}"
                part="button"
                aria-label="${this.tooltipText}"
              >
                <span>${unsafeHTML(thumbsupIcon)}</span>
              </button>
              <div class="tooltip">${this.tooltipText}</div>
            </div>
          `}
      ${this.isModalOpen
        ? html`
            <div
              class="modal-backdrop"
              @click="${this._closeModal}"
              role="dialog"
              aria-modal="true"
            >
              <div
                class="modal-content"
                @click="${(e: Event) => e.stopPropagation()}"
              >
                <div class="modal-header">
                  <h3 id="modal-title">${this.modalTitle}</h3>
                  <button
                    class="close-button"
                    @click="${this._closeModal}"
                    aria-label="Close modal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-x-icon lucide-x"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                ${this.isConfigLoading
                  ? html`<div style="padding: 20px; text-align: center;">
                      Loading configuration...
                    </div>`
                  : html`
                      <div class="mode-tabs">
                        ${(() => {
                          return this._tabs.map(
                            (tab) => html`
                              <button
                                class="mode-tab ${this._activeTabId === tab.id
                                  ? "active"
                                  : ""}"
                                @click="${() => this._switchTab(tab.id)}"
                              >
                                ${this._renderTabIcon(tab.icon)} ${tab.label}
                              </button>
                            `,
                          );
                        })()}
                      </div>
                      <wafir-form
                        .fields="${this._getActiveFormConfig()}"
                        .formLabel="${this._getActiveTab()?.label || ""}"
                        .showBrowserInfo="${this._telemetry.browserInfo}"
                        .showConsoleLog="${this._telemetry.consoleLog}"
                        .showScreenshot="${this._telemetry.screenshot}"
                        @form-submit="${this._handleSubmit}"
                      ></wafir-form>
                    `}
              </div>
            </div>
          `
        : ""}

      <wafir-highlighter></wafir-highlighter>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-widget": WafirWidget;
  }
}
