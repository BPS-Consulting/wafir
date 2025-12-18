import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import globalStyles from "./index.css?inline";
import bugIcon from "./assets/bug.svg?raw";
import "./wafir-form.js";
import type { FieldConfig } from "./types.js";

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

  @state()
  isModalOpen = false;

  @state()
  isConfigLoading = false;

  @state()
  configFetchError: string | null = null;

  @property({ type: Array })
  formConfig: FieldConfig[] = [
    // Default fallback config (Matches your requirements for "Feedback")
    { id: "title", label: "Title", type: "text", required: true },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },
    {
      id: "type",
      label: "Type",
      type: "select",
      options: ["Bug", "Feature"],
      required: true,
    },
  ];

  static styles = [
    unsafeCSS(globalStyles),
    css`
      :host {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
      }

      /* Trigger button container */
      .trigger-container {
        position: fixed;
        z-index: 9998;
      }

      .trigger-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .trigger-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .trigger-container.top-right {
        top: 20px;
        right: 20px;
      }

      .trigger-container.top-left {
        top: 20px;
        left: 20px;
      }

      /* Button */
      button[part="button"] {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #2563eb;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }

      button[part="button"]:hover {
        background: #1d4ed8;
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      button[part="button"] span {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }

      button[part="button"] svg {
        width: 24px;
        height: 24px;
        stroke: white;
      }

      /* Tooltip */
      .tooltip {
        position: absolute;
        bottom: 60px;
        right: 0;
        background: #1f2937;
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }

      .trigger-container:hover .tooltip {
        opacity: 1;
      }

      /* Modal backdrop */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Modal content */
      .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Modal header */
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 28px;
        color: #6b7280;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .close-button:hover {
        background: #f3f4f6;
        color: #111827;
      }
    `,
  ];

  private async _handleTriggerClick() {
    this.isModalOpen = !this.isModalOpen;
    if (this.isModalOpen) {
      await this._fetchConfig();
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
        this.repo
      );

      if (config && config.fields) {
        // Map bridge fields to widget fields (name -> id)
        this.formConfig = config.fields.map((field: any) => ({
          id: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options,
        }));
      }

      if (config && config.feedback && config.feedback.title) {
        this.modalTitle = config.feedback.title;
      }
    } catch (error) {
      console.warn(
        "Wafir: Failed to fetch remote config, using defaults",
        error
      );
      // We keep the default formConfig
    } finally {
      this.isConfigLoading = false;
    }
  }

  private _closeModal() {
    this.isModalOpen = false;
  }

  @property({ type: Number })
  installationId = 0;

  @property({ type: String })
  owner = "";

  @property({ type: String })
  repo = "";

  private async _handleSubmit(event: CustomEvent) {
    const formData = event.detail.formData;

    // Config validation
    if (!this.installationId || !this.owner || !this.repo) {
      console.error(
        "Wafir: Missing configuration (installationId, owner, or repo)"
      );
      alert("Widget configuration error");
      return;
    }

    try {
      // Map form data to API payload
      // Assuming formData has 'title', 'description', and 'type' based on default config
      const title = formData.title || "No Title";
      const description = formData.description || "";
      const type = formData.type; // "Bug" or "Feature"

      const labels = ["feedback"];
      if (type) {
        labels.push(type.toLowerCase());
      }

      const { submitIssue } = await import("./api/client.js");

      await submitIssue(
        this.installationId,
        this.owner,
        this.repo,
        title,
        description,
        labels
      );

      // Success handling
      alert("Feedback submitted successfully!");
      this._closeModal();

      // Optional: Reset form? Not easily possible with current architecture without forcing re-render of child
    } catch (error) {
      console.error("Wafir: Submit failed", error);
      alert("Failed to submit feedback. Please try again.");
    }
  }

  render() {
    return html`
      <div class="trigger-container ${this.position}">
        <button
          @click="${this._handleTriggerClick}"
          part="button"
          aria-label="${this.tooltipText}"
        >
          <span>${unsafeHTML(bugIcon)}</span>
        </button>
        <div class="tooltip">${this.tooltipText}</div>
      </div>

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
                    &times;
                  </button>
                </div>

                ${this.isConfigLoading
                  ? html`<div style="padding: 20px; text-align: center;">
                      Loading configuration...
                    </div>`
                  : html`
                      <wafir-form
                        .fields="${this.formConfig}"
                        @form-submit="${this._handleSubmit}"
                      ></wafir-form>
                    `}
              </div>
            </div>
          `
        : ""}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-reporter": MyElement;
  }
}
