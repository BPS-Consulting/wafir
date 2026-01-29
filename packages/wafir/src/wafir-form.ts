// Copyright (c) BPS-Consulting. Licensed under the AGPLv3 License.
import { LitElement, html, unsafeCSS } from "lit";
import formStyles from "./styles/wafir-form.css?inline";
import "./star-rating.js";
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

  @property({ type: Boolean })
  showScreenshot = true;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  bridgeAvailable = true;

  private _capturedImageController = new StoreController(this, capturedImage);
  private _formDataController = new StoreController(this, formData);
  private _browserInfoController = new StoreController(this, browserInfo);
  private _consoleLogsController = new StoreController(this, consoleLogs);

  static styles = [unsafeCSS(formStyles)];

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
    this.loading = true;
    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: formData.get() },
        bubbles: true,
        composed: true,
      }),
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

      case "dropdown": // GitHub Issue Forms (was select)
        return html`
          <select
            id="${field.id}"
            .value="${value}"
            ?required="${field.required}"
            @change="${(e: Event) => this._handleInputChange(e, field.id)}"
          >
            <option value="" disabled selected>Select an option</option>
            ${field.options?.map(
              (opt) => html`<option value="${opt}">${opt}</option>`,
            )}
          </select>
        `;

      case "checkboxes": // GitHub Issue Forms (was checkbox group; multi-select)
        return html`
          <div class="checkboxes-group">
            ${field.options?.map(
              (opt) => html`
                <label>
                  <input
                    type="checkbox"
                    name="${field.id}"
                    .checked="${(value || []).includes(opt)}"
                    @change="${(e: Event) => {
                      const checked = (e.target as HTMLInputElement).checked;
                      let arr = Array.isArray(value) ? [...value] : [];
                      if (checked) arr.push(opt);
                      else arr = arr.filter((v) => v !== opt);
                      setFormData({ ...formData.get(), [field.id]: arr });
                    }}"
                  />
                  ${opt}
                </label>
              `,
            )}
          </div>
        `;
        return html`
          <select
            id="${field.id}"
            .value="${value}"
            ?required="${field.required}"
            @change="${(e: Event) => this._handleInputChange(e, field.id)}"
          >
            <option value="" disabled selected>Select an option</option>
            ${field.options?.map(
              (opt) => html`<option value="${opt}">${opt}</option>`,
            )}
          </select>
        `;

        // removed unsupported legacy: case "switch":
        const currentValue = value || field.options?.[0] || "";
        return html`
          <div class="switch-container">
            ${field.options?.map(
              (opt) => html`
                <button
                  type="button"
                  class="switch-option ${currentValue === opt ? "active" : ""}"
                  @click="${() => {
                    setFormData({ ...formData.get(), [field.id]: opt });
                  }}"
                >
                  ${opt}
                </button>
              `,
            )}
          </div>
        `;

        // (was: case "checkbox":)

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

        // removed unsupported legacy: case "screenshot":
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

      case "rating":
        return html`
          <wafir-star-rating
            .value="${Number(value) || 0}"
            .labels="${field.ratingLabels || []}"
            @rating-change="${(e: CustomEvent) => {
              setFormData({ ...formData.get(), [field.id]: e.detail.value });
            }}"
          ></wafir-star-rating>
        `;

      case "input": // GitHub Issue Forms (was text)

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
          // (was: if (field.type === "checkbox"))
          if (field.type === "checkboxes")
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

        <button
          class="submit-button"
          type="submit"
          ?disabled="${this.loading || !this.bridgeAvailable}"
        >
          ${this.loading
            ? html`<span class="spinner"></span> Submitting...`
            : !this.bridgeAvailable
              ? "Service Unavailable"
              : "Submit"}
        </button>

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
                    `,
                  )}
                </div>
              </div>
            `
          : ""}
      </form>
    `;
  }
}
