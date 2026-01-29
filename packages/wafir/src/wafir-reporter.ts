import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import reporterStyles from "./styles/wafir-reporter.css?inline";
import bugIcon from "./assets/bug.svg?raw";
import thumbsupIcon from "./assets/thumbsup.svg?raw";
import lightbulbIcon from "./assets/lightbulb.svg?raw";
import "./wafir-form.js";
import "./wafir-highlighter.js";
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
import type { FieldConfig, TabConfig } from "./types.js";
import { dataURLtoBlob } from "./utils/file.js";
import type { ConsoleLog } from "./utils/telemetry.js";
import { getBrowserInfo, consoleInterceptor } from "./utils/telemetry.js";
import { getDefaultTabs, getDefaultFields } from "./default-config.js";

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const TAB_ICONS: Record<string, string> = {
  thumbsup: thumbsupIcon,
  lightbulb: lightbulbIcon,
  bug: bugIcon,
};

@customElement("wafir-reporter")
export class WafirReporter extends LitElement {
  @property({ type: String })
  buttonText = "";

  @property({ type: String })
  modalTitle = "Contact Us";

  @property({ type: String })
  position: WidgetPosition = "bottom-right";

  @property({ type: String })
  tooltipText = "Open Issue Reporter";

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

  static styles = [unsafeCSS(reporterStyles)];

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

  private async _fetchConfig() {
    if (!this.installationId || !this.owner || !this.repo) return;

    this.isConfigLoading = true;
    this.configFetchError = null;

    try {
      const { getWafirConfig } = await import("./api/client.js");
      const config = await getWafirConfig(
        this.installationId,
        this.owner,
        this.repo,
        this.bridgeUrl || undefined,
      );

      if (config) {
        const remoteConfig = config;
        if (remoteConfig.tabs && Array.isArray(remoteConfig.tabs)) {
          this._tabs = remoteConfig.tabs.map((tab: any) => ({
            id: tab.id,
            label: tab.label || this._capitalize(tab.id),
            icon: tab.icon,
            isFeedback: tab.isFeedback ?? false,
            fields:
              tab.fields && tab.fields.length > 0
                ? tab.fields.map((f: any) => ({
                    id: f.name || f.id,
                    label: f.label,
                    type: f.type,
                    required: f.required,
                    options: f.options,
                    placeholder: f.placeholder,
                    ratingLabels: f.ratingLabels,
                  }))
                : getDefaultFields(tab.id),
          }));
          if (this._tabs.length > 0) {
            this._activeTabId = this._tabs[0].id;
          }
        }

        if (remoteConfig.title) {
          this.modalTitle = remoteConfig.title;
        }

        if (remoteConfig.telemetry) {
          this._telemetry = {
            screenshot: remoteConfig.telemetry.screenshot ?? true,
            browserInfo: remoteConfig.telemetry.browserInfo ?? true,
            consoleLog: remoteConfig.telemetry.consoleLog ?? false,
          };
        }
      }
    } catch (error) {
      console.warn(
        "Wafir: Failed to fetch remote config, using defaults",
        error,
      );
    } finally {
      this.isConfigLoading = false;
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
    return tab?.fields || [];
  }

  private _switchTab(tabId: string) {
    this._activeTabId = tabId;
  }

  @property({ type: Number })
  installationId = 0;

  @property({ type: String })
  owner = "";

  @property({ type: String })
  repo = "";

  @property({ type: String })
  bridgeUrl = "";

  private async _handleSubmit(event: CustomEvent) {
    const formData = event.detail.formData;
    const activeTab = this._getActiveTab();

    if (!this.installationId || !this.owner || !this.repo) {
      console.error(
        "Wafir: Missing configuration (installationId, owner, or repo)",
      );
      alert("Widget configuration error");
      return;
    }

    try {
      const title = formData.title || activeTab?.label || "Submission";
      let finalBody = formData.description || "";
      const labels: string[] = [this._activeTabId];

      const { submitIssue } = await import("./api/client.js");

      const screenshotDataUrl = this._capturedImageController.value;
      const screenshotBlob = screenshotDataUrl
        ? dataURLtoBlob(screenshotDataUrl)
        : undefined;

      if (this._telemetry.browserInfo && browserInfo.get()) {
        const info = browserInfo.get()!;
        finalBody += `\n\n# Browser Info\n| Field | Value |\n| :--- | :--- |\n| URL | ${info.url} |\n| User Agent | \`${info.userAgent}\` |\n| Viewport | ${info.viewportWidth}x${info.viewportHeight} |\n| Language | ${info.language} |`;
      }

      if (this._telemetry.consoleLog && consoleLogs.get().length > 0) {
        const logs = consoleLogs.get();
        finalBody += `\n\n# Console Logs\n\`\`\`\n${logs
          .map((l: ConsoleLog) => `[${l.type.toUpperCase()}] ${l.message}`)
          .join("\n")}\n\`\`\``;
      }

      const isFeedbackTab = activeTab?.isFeedback ?? false;
      const submissionType: "issue" | "feedback" = isFeedbackTab
        ? "feedback"
        : "issue";
      const rating = isFeedbackTab
        ? Number(formData.rating) || undefined
        : undefined;

      await submitIssue(
        this.installationId,
        this.owner,
        this.repo,
        title,
        finalBody,
        labels,
        screenshotBlob,
        this.bridgeUrl || undefined,
        rating,
        submissionType,
      );

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
                        ${this._tabs.map(
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
                        )}
                      </div>
                      <wafir-form
                        .fields="${this._getActiveFormConfig()}"
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
    "wafir-reporter": WafirReporter;
  }
}
