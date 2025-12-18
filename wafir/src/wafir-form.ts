import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { StoreController } from "@nanostores/lit";
import {
  startSelection,
  capturedImage,
  setCapturedImage,
  formData,
  setFormData,
  browserInfo,
  consoleLogs,
} from "./store";
import { takeFullPageScreenshot } from "./utils/screenshot";
import type { FieldConfig } from "./types";

@customElement("wafir-form")
export class WafirForm extends LitElement {
  @property({ type: Array })
  fields: FieldConfig[] = [];

  @property({ type: Boolean })
  showBrowserInfo = false;

  @property({ type: Boolean })
  showConsoleLog = false;

  private _capturedImageController = new StoreController(this, capturedImage);
  private _formDataController = new StoreController(this, formData);
  private _browserInfoController = new StoreController(this, browserInfo);
  private _consoleLogsController = new StoreController(this, consoleLogs);

  static styles = css`
    :host {
      display: block;
    }
    form {
      padding: 20px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
      font-size: 13px;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    /* Checkbox specific styles */
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .checkbox-group input {
      width: auto;
    }
    .checkbox-group label {
      margin-bottom: 0;
    }

    .submit-button {
      width: 100%;
      padding: 10px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 8px;
    }
    .submit-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .screenshot-preview {
      margin-top: 8px;
      position: relative;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      max-height: 200px;
      display: flex;
      justify-content: center;
      background: #f9fafb;
    }

    .screenshot-preview img {
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }

    .screenshot-clear {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .capture-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 8px;
      background: #f3f4f6;
      border: 1px dashed #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      color: #374151;
      transition: all 0.2s;
    }

    .capture-button:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .screenshot-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .screenshot-actions button {
      flex: 1;
      padding: 6px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
    }

    .screenshot-actions button:hover {
      background: #f3f4f6;
    }

    .screenshot-actions .highlight-btn {
      color: #2563eb;
      border-color: #2563eb;
      background: #eff6ff;
    }

    .screenshot-actions .highlight-btn:hover {
      background: #dbeafe;
    }

    .telemetry-section {
      margin-top: 16px;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 12px;
      color: #4b5563;
    }

    .telemetry-section h4 {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #374151;
      font-weight: 600;
    }

    .telemetry-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 12px;
    }

    .telemetry-label {
      font-weight: 500;
      color: #6b7280;
    }

    .logs-container {
      max-height: 150px;
      overflow-y: auto;
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      background: #111827;
      color: #f3f4f6;
      padding: 8px;
      border-radius: 4px;
    }

    .log-item {
      margin-bottom: 4px;
      word-break: break-all;
    }

    .log-warn {
      color: #fde047;
    }
    .log-error {
      color: #f87171;
    }
  `;

  willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has("fields")) {
      const currentData = formData.get();
      let hasChanges = false;
      const newData = { ...currentData };

      this.fields.forEach((field) => {
        if (field.defaultValue && !newData[field.id]) {
          newData[field.id] = field.defaultValue;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setFormData(newData);
      }
    }
  }

  private _handleInputChange(e: Event, fieldId: string) {
    const target = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;

    setFormData({ ...formData.get(), [fieldId]: value });
  }

  private _handleSubmit(event: Event) {
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: formData.get() },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Helper to render specific input types
  private _renderFieldInput(field: FieldConfig) {
    const value = this._formDataController.value[field.id] || "";

    switch (field.type) {
      case "textarea":
        return html`
          <textarea
            id="${field.id}"
            .value="${value}"
            placeholder="${field.placeholder || ""}"
            ?required="${field.required}"
            @input="${(e: Event) => this._handleInputChange(e, field.id)}"
          ></textarea>
        `;

      case "select":
        return html`
          <select
            id="${field.id}"
            .value="${value}"
            ?required="${field.required}"
            @change="${(e: Event) => this._handleInputChange(e, field.id)}"
          >
            <option value="" disabled selected>Select an option</option>
            ${field.options?.map(
              (opt) => html`<option value="${opt}">${opt}</option>`
            )}
          </select>
        `;

      case "checkbox":
        return html`
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="${field.id}"
              .checked="${!!value}"
              @change="${(e: Event) => this._handleInputChange(e, field.id)}"
            />
            <label for="${field.id}">${field.label}</label>
          </div>
        `;

      case "screenshot":
        return html`
          <div>
            ${this._capturedImageController.value
              ? html`
                  <div class="screenshot-preview">
                    <img
                      src="${this._capturedImageController.value}"
                      alt="Captured screenshot"
                    />
                    <button
                      type="button"
                      class="screenshot-clear"
                      @click="${() => setCapturedImage(null)}"
                    >
                      &times;
                    </button>
                  </div>
                  <div class="screenshot-actions">
                    <button
                      type="button"
                      @click="${() => takeFullPageScreenshot()}"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      class="highlight-btn"
                      @click="${() => startSelection()}"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Highlight
                    </button>
                  </div>
                `
              : html`
                  <button
                    type="button"
                    class="capture-button"
                    @click="${() => takeFullPageScreenshot()}"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Take Screenshot
                  </button>
                `}
          </div>
        `;

      case "text":
      case "email":
      default:
        return html`
          <input
            type="${field.type}"
            id="${field.id}"
            .value="${value}"
            placeholder="${field.placeholder || ""}"
            ?required="${field.required}"
            ?hidden="${field.hidden}"
            @input="${(e: Event) => this._handleInputChange(e, field.id)}"
          />
        `;
    }
  }

  render() {
    return html`
      <form @submit="${this._handleSubmit}">
        ${this.fields.map((field) => {
          if (field.hidden) return this._renderFieldInput(field);
          if (field.type === "checkbox")
            return html`<div class="form-group">
              ${this._renderFieldInput(field)}
            </div>`;

          return html`
            <div class="form-group">
              <label for="${field.id}">
                ${field.label} ${field.required ? "*" : ""}
              </label>
              ${this._renderFieldInput(field)}
            </div>
          `;
        })}

        <button class="submit-button" type="submit">Submit</button>

        ${this.showBrowserInfo && this._browserInfoController.value
          ? html`
              <div class="telemetry-section">
                <h4>Browser Information</h4>
                <div class="telemetry-grid">
                  <span class="telemetry-label">URL:</span>
                  <span>${this._browserInfoController.value.url}</span>
                  <span class="telemetry-label">Viewport:</span>
                  <span
                    >${this._browserInfoController.value.viewportWidth}x${this
                      ._browserInfoController.value.viewportHeight}</span
                  >
                  <span class="telemetry-label">UA:</span>
                  <span style="font-size: 10px;"
                    >${this._browserInfoController.value.userAgent}</span
                  >
                </div>
              </div>
            `
          : ""}
        ${this.showConsoleLog && this._consoleLogsController.value.length > 0
          ? html`
              <div class="telemetry-section">
                <h4>Recent Console Logs</h4>
                <div class="logs-container">
                  ${this._consoleLogsController.value.map(
                    (log) => html`
                      <div
                        class="log-item ${log.type === "warn"
                          ? "log-warn"
                          : "log-error"}"
                      >
                        [${log.timestamp.split("T")[1].split(".")[0]}]
                        ${log.message}
                      </div>
                    `
                  )}
                </div>
              </div>
            `
          : ""}
      </form>
    `;
  }
}
