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
import type { FieldConfig } from "./types.js";
import { dataURLtoBlob } from "./utils/file.js";
import type { ConsoleLog } from "./utils/telemetry.js";
import { getBrowserInfo, consoleInterceptor } from "./utils/telemetry.js";
import {
  type TabType,
  type TabConfigs,
  DEFAULT_TABS,
  getDefaultTabConfigs,
} from "./default-config.js";

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const TAB_ICONS: Record<string, string> = {
  thumbsup: thumbsupIcon,
  lightbulb: lightbulbIcon,
  bug: bugIcon,
};

@customElement("wafir-reporter")
export class MyElement extends LitElement {
  @property({ type: String })
  buttonText = "";

  @property({ type: String })
  modalTitle = "Contact Us";

  @property({ type: String })
  position: WidgetPosition = "bottom-right";

  @property({ type: String })
  tooltipText = "Open Issue Reporter";

  @property({ type: Object })
  config: Partial<TabConfigs> = {};

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
  private _hasCustomTrigger = false;

  @state()
  private _remoteConfig: any = null;

  @state()
  private _tabConfigs: TabConfigs = getDefaultTabConfigs();

  @state()
  private _activeTab: TabType = "feedback";

  @state()
  private _availableTabs = DEFAULT_TABS;

  static styles = [unsafeCSS(reporterStyles)];

  connectedCallback() {
    super.connectedCallback();
    this._checkCustomTrigger();
    this._mergeInlineConfig();
  }

  private _checkCustomTrigger() {
    this._hasCustomTrigger = this.querySelector('[slot="trigger"]') !== null;
  }

  private _mergeInlineConfig() {
    if (this.config && Object.keys(this.config).length > 0) {
      const merged = { ...this._tabConfigs };
      for (const key of Object.keys(this.config) as TabType[]) {
        if (this.config[key]) {
          merged[key] = this.config[key]!;
        }
      }
      this._tabConfigs = merged;
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
    await this._fetchConfig();
  }

  private async _handleTriggerClick() {
    if (this.isModalOpen) {
      this._closeModal();
    } else {
      await this._openModal();
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
        this._remoteConfig = config;

        if (config.fields) {
          const issueFields: FieldConfig[] = config.fields.map(
            (field: any) => ({
              id: field.name,
              label: field.label,
              type: field.type,
              required: field.required,
              options: field.options,
            }),
          );

          if (config.issueTypes && config.issueTypes.length > 0) {
            issueFields.unshift({
              id: "issueType",
              label: "Issue Type",
              type: "select",
              required: true,
              options: config.issueTypes.map((t: any) => t.name),
            });
          }

          if (config.issue && config.issue.screenshot) {
            issueFields.push({
              id: "screenshot",
              label: "Screenshot",
              type: "screenshot",
            });
          }

          this._tabConfigs = {
            ...this._tabConfigs,
            issue: issueFields,
          };
        }

        if (config.feedback && config.feedback.title) {
          this.modalTitle = config.feedback.title;
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

  private _closeModal() {
    this.isModalOpen = false;
    resetState();
  }

  private _getActiveFormConfig(): FieldConfig[] {
    return this._tabConfigs[this._activeTab] || [];
  }

  private _switchTab(tab: TabType) {
    this._activeTab = tab;
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has("_isSelectingController")) {
      // Logic handled by the fact that we check isSelecting in render
    }
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

    if (!this.installationId || !this.owner || !this.repo) {
      console.error(
        "Wafir: Missing configuration (installationId, owner, or repo)",
      );
      alert("Widget configuration error");
      return;
    }

    try {
      let title: string;
      let finalBody: string;
      const labels: string[] = [this._activeTab];

      if (this._activeTab === "feedback") {
        const rating = Number(formData.rating) || 0;
        const hasRatingField = this._tabConfigs.feedback.some(
          (f) => f.id === "rating",
        );
        if (hasRatingField && rating > 0) {
          title = formData.title || "Feedback";
        } else {
          title = `Feedback rating: ${rating}`;
        }
        finalBody = formData.description || "";
      } else if (this._activeTab === "suggestion") {
        title = formData.title || "Suggestion";
        finalBody = formData.description || "";
      } else {
        title = formData.title || "No Title";
        finalBody = formData.description || "";
        const type = formData.type;
        if (type) {
          labels.push(type.toLowerCase());
        }
      }

      const { submitIssue } = await import("./api/client.js");

      const screenshotDataUrl = this._capturedImageController.value;
      const screenshotBlob = screenshotDataUrl
        ? dataURLtoBlob(screenshotDataUrl)
        : undefined;

      if (
        this._activeTab === "issue" &&
        this._remoteConfig?.issue?.browserInfo &&
        browserInfo.get()
      ) {
        const info = browserInfo.get()!;
        finalBody += `\n\n# Browser Info\n| Field | Value |\n| :--- | :--- |\n| URL | ${info.url} |\n| User Agent | \`${info.userAgent}\` |\n| Viewport | ${info.viewportWidth}x${info.viewportHeight} |\n| Language | ${info.language} |`;
      }

      if (
        this._activeTab === "issue" &&
        this._remoteConfig?.issue?.consoleLog &&
        consoleLogs.get().length > 0
      ) {
        const logs = consoleLogs.get();
        finalBody += `\n\n# Console Logs\n\`\`\`\n${logs
          .map((l: ConsoleLog) => `[${l.type.toUpperCase()}] ${l.message}`)
          .join("\n")}\n\`\`\``;
      }

      const submissionType: "issue" | "feedback" =
        this._activeTab === "feedback" ? "feedback" : "issue";
      const rating =
        this._activeTab === "feedback"
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

      alert("Feedback submitted successfully!");
      resetState();
      this.isModalOpen = false;
    } catch (error) {
      console.error("Wafir: Submit failed", error);
      alert("Failed to submit feedback. Please try again.");
    }
  }

  private _renderTabIcon(iconName: string) {
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
                        ${this._availableTabs.map(
                          (tab) => html`
                            <button
                              class="mode-tab ${this._activeTab === tab.id
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
                        .showBrowserInfo="${this._activeTab === "issue" &&
                        !!this._remoteConfig?.issue?.browserInfo}"
                        .showConsoleLog="${this._activeTab === "issue" &&
                        !!this._remoteConfig?.issue?.consoleLog}"
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
    "wafir-reporter": MyElement;
  }
}
