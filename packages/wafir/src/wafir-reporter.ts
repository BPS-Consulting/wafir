import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import reporterStyles from "./styles/wafir-reporter.css?inline";
import bugIcon from "./assets/bug.svg?raw";
import thumbsupIcon from "./assets/thumbsup.svg?raw";
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

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

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
  private _widgetMode: "issue" | "feedback" | "both" = "issue";

  @state()
  private _activeTab: "issue" | "feedback" = "issue";

  @property({ type: Array })
  formConfig: FieldConfig[] = [
    { id: "title", label: "Title", type: "text", required: true },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    {
      id: "type",
      label: "Type",
      type: "select",
      options: ["Bug", "Feature"],
      required: true,
    },
  ];

  static styles = [unsafeCSS(reporterStyles)];

  connectedCallback() {
    super.connectedCallback();
    this._checkCustomTrigger();
  }

  private _checkCustomTrigger() {
    this._hasCustomTrigger = this.querySelector('[slot="trigger"]') !== null;
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
        this._widgetMode = config.mode || "issue";
        this._activeTab =
          this._widgetMode === "feedback" ? "feedback" : "issue";

        if (config.fields) {
          this.formConfig = config.fields.map((field: any) => ({
            id: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options,
          }));

          // Add Issue Type select if types are available
          if (config.issueTypes && config.issueTypes.length > 0) {
            this.formConfig = [
              {
                id: "issueType",
                label: "Issue Type",
                type: "select",
                required: true,
                options: config.issueTypes.map((t: any) => t.name),
              },
              ...this.formConfig,
            ];
          }

          if (config.issue && config.issue.screenshot) {
            this.formConfig = [
              ...this.formConfig,
              { id: "screenshot", label: "Screenshot", type: "screenshot" },
            ];
          }
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
      this._widgetMode = "both";
    } finally {
      this.isConfigLoading = false;
    }
  }

  private _closeModal() {
    this.isModalOpen = false;
    resetState();
  }

  private _getFeedbackFormConfig(): FieldConfig[] {
    return [
      {
        id: "rating",
        label: "How would you rate your experience?",
        type: "rating",
        required: true,
      },
      {
        id: "comment",
        label: "Additional comments (optional)",
        type: "textarea",
        required: false,
      },
    ];
  }

  private _getActiveFormConfig(): FieldConfig[] {
    if (this._activeTab === "feedback") {
      return this._getFeedbackFormConfig();
    }
    return this.formConfig;
  }

  private _switchTab(tab: "issue" | "feedback") {
    this._activeTab = tab;
  }

  // Effect to reopen modal after selection
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
    const isFeedbackMode = this._activeTab === "feedback";

    // Config validation
    if (!this.installationId || !this.owner || !this.repo) {
      console.error(
        "Wafir: Missing configuration (installationId, owner, or repo)",
      );
      alert("Widget configuration error");
      return;
    }

    try {
      // Map form data based on submission type
      let title: string;
      let finalBody: string;
      const labels = ["feedback"];

      if (isFeedbackMode) {
        const rating = Number(formData.rating) || 0;
        title = `Feedback: ${rating} star${rating !== 1 ? "s" : ""}`;
        finalBody = formData.comment || "";
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

      // Append telemetry to body (only for issue mode)
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

      // Determine submission type and rating
      const submissionType: "issue" | "feedback" = this._activeTab;
      const rating = isFeedbackMode
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

      // Success handling
      alert("Feedback submitted successfully!");
      resetState();
      this.isModalOpen = false;

      // Optional: Reset form? Not easily possible with current architecture without forcing re-render of child
    } catch (error) {
      console.error("Wafir: Submit failed", error);
      alert("Failed to submit feedback. Please try again.");
    }
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
                      ${this._widgetMode === "both"
                        ? html`
                            <div class="mode-tabs">
                              <button
                                class="mode-tab ${this._activeTab === "issue"
                                  ? "active"
                                  : ""}"
                                @click="${() => this._switchTab("issue")}"
                              >
                                ${unsafeHTML(bugIcon)} Report Issue
                              </button>
                              <button
                                class="mode-tab ${this._activeTab === "feedback"
                                  ? "active"
                                  : ""}"
                                @click="${() => this._switchTab("feedback")}"
                              >
                                ${unsafeHTML(thumbsupIcon)} Give Feedback
                              </button>
                            </div>
                          `
                        : ""}
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
