// Copyright (c) BPS-Consulting. Licensed under the AGPLv3 License.
import { LitElement, html, unsafeCSS } from "lit";
import formStyles from "./styles/wafir-form.css?inline";
import "./rating";
import { RATING_OPTIONS, RATING_ICON } from "./default-config.js";
import { customElement, property } from "lit/decorators.js";
import { StoreController } from "@nanostores/lit";
import {
  startSelection,
  formData,
  getTabFormData,
  setTabFormData,
  browserInfo,
  consoleLogs,
  capturedImage,
  setCapturedImage,
} from "./store";
import { takeFullPageScreenshot } from "./utils/screenshot";
import { resolveDateValue, isDateToken } from "./utils/date";
import type { FieldConfigApi as FieldConfig } from "./api/client";
import type { BrowserInfo, ConsoleLog } from "./utils/telemetry";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

@customElement("wafir-form")
export class WafirForm extends LitElement {
  @property({ type: String })
  formLabel = "";

  @property({ type: String })
  tabId = "";

  private _fields: FieldConfig[] = [];

  @property({ type: Array })
  get fields(): FieldConfig[] {
    return this._fields;
  }
  set fields(val: FieldConfig[]) {
    this._fields = val || [];
  }

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  bridgeAvailable = true;

  private _formDataController = new StoreController(this, formData);
  private _browserInfoController = new StoreController(this, browserInfo);
  private _consoleLogsController = new StoreController(this, consoleLogs);
  private _capturedImageController = new StoreController(this, capturedImage);

  // Track which autofill fields are enabled (checked)
  private _autofillEnabled: Record<string, boolean> = {};

  static styles = [unsafeCSS(formStyles)];

  /**
   * Formats browser info as a readable text string for textarea display.
   */
  private _formatBrowserInfo(info: BrowserInfo): string {
    const lines: string[] = [];
    if (info.url) lines.push(`URL: ${info.url}`);
    if (info.userAgent) lines.push(`User Agent: ${info.userAgent}`);
    if (info.viewportWidth && info.viewportHeight) {
      lines.push(`Viewport: ${info.viewportWidth}x${info.viewportHeight}`);
    }
    if (info.language) lines.push(`Language: ${info.language}`);
    return lines.join("\n");
  }

  /**
   * Formats console logs as a readable text string for textarea display.
   */
  private _formatConsoleLogs(logs: ConsoleLog[]): string {
    if (!logs || logs.length === 0) return "";
    return logs
      .map(
        (log) =>
          `[${log.type.toUpperCase()}] ${log.timestamp.split("T")[1]?.split(".")[0] || ""} ${log.message}`,
      )
      .join("\n");
  }

  /**
   * Handles toggling of autofill checkbox for telemetry fields.
   */
  private _handleAutofillToggle(fieldId: string, autofillType: string, checked: boolean) {
    this._autofillEnabled[fieldId] = checked;
    const currentData = getTabFormData(this.tabId);

    if (checked) {
      // Populate field with telemetry data
      let value = "";
      if (autofillType === "browserInfo") {
        const info = this._browserInfoController.value;
        if (info) {
          value = this._formatBrowserInfo(info);
        }
      } else if (autofillType === "consoleLog") {
        const logs = this._consoleLogsController.value;
        if (logs && logs.length > 0) {
          value = this._formatConsoleLogs([...logs]);
        }
      } else if (autofillType === "screenshot") {
        // Automatically take a screenshot when checkbox is checked
        takeFullPageScreenshot();
      }
      setTabFormData(this.tabId, { ...currentData, [fieldId]: value });
    } else {
      // Clear the field and screenshot if applicable
      if (autofillType === "screenshot") {
        setCapturedImage(null);
      }
      setTabFormData(this.tabId, { ...currentData, [fieldId]: "" });
    }
    this.requestUpdate();
  }

  /**
   * Renders the screenshot field with opt-in checkbox and capture controls.
   */
  private _renderScreenshotField(_field: FieldConfig, isEnabled: boolean) {
    const hasScreenshot = !!this._capturedImageController.value;

    if (!isEnabled) {
      return html`
        <div class="screenshot-placeholder">
          <span class="screenshot-hint">Enable the checkbox above to capture a screenshot</span>
        </div>
      `;
    }

    return html`
      <div class="screenshot-container">
        ${hasScreenshot
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
              <div class="screenshot-placeholder">
                <span class="screenshot-hint">Capturing screenshot...</span>
              </div>
            `}
      </div>
    `;
  }

  /**
   * Returns a human-readable label for an autofill type.
   */
  private _getAutofillLabel(autofillType: string, customLabel?: string): string {
    if (customLabel) return customLabel;
    switch (autofillType) {
      case "browserInfo":
        return "Browser Info";
      case "consoleLog":
        return "Console Logs";
      case "screenshot":
        return "Screenshot";
      default:
        return autofillType;
    }
  }

  willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has("fields")) {
      const currentData = getTabFormData(this.tabId);
      let hasChanges = false;
      const newData = { ...currentData };

      this.fields.forEach((field) => {
        const fieldId = String(field.id) || "";
        const defaultValue = field.attributes?.value;

        // Only set default if field doesn't already have a value
        if (defaultValue && !newData[fieldId]) {
          // For date fields, resolve tokens like "today" or "today+7"
          if (field.type === "date" && isDateToken(defaultValue)) {
            newData[fieldId] = resolveDateValue(defaultValue);
          } else {
            newData[fieldId] = defaultValue;
          }
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setTabFormData(this.tabId, newData);
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

    const currentData = getTabFormData(this.tabId);
    setTabFormData(this.tabId, { ...currentData, [fieldId]: value });
  }

  private _handleSubmit(event: Event) {
    event.preventDefault();
    this.loading = true;
    const currentData = getTabFormData(this.tabId);
    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: currentData },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Helper to render specific input types
  // Render form field input for all supported types
  private _renderFieldInput(field: FieldConfig) {
    const tabData = this._formDataController.value[this.tabId] || {};
    const value = tabData[String(field.id)] || "";
    const opts = field.attributes?.options;
    function isOptionObjectArray(
      opts: FieldConfig["attributes"] extends undefined
        ? undefined
        : NonNullable<FieldConfig["attributes"]>["options"],
    ): opts is Array<{ label: string; required?: boolean }> {
      return (
        Array.isArray(opts) &&
        opts.length > 0 &&
        typeof opts[0] === "object" &&
        opts[0] !== null &&
        "label" in opts[0]
      );
    }

    switch (field.type) {
      case "markdown": {
        const markdown =
          field.attributes?.value || field.attributes?.label || "";
        const htmlString = DOMPurify.sanitize(marked.parse(markdown) as string);
        return html`<div class="form-markdown">${unsafeHTML(htmlString)}</div>`;
      }
      case "textarea": {
        const autofill = (field.attributes as any)?.autofill;
        const isAutofillField = autofill === "browserInfo" || autofill === "consoleLog" || autofill === "screenshot";
        const isAutofillEnabled = this._autofillEnabled[String(field.id)] ?? false;

        // For screenshot autofill, render the screenshot capture UI
        if (autofill === "screenshot") {
          return this._renderScreenshotField(field, isAutofillEnabled);
        }

        return html`
          <textarea
            id="${String(field.id)}"
            .value="${value}"
            placeholder="${field.attributes!.placeholder || ""}"
            ?required="${field.validations?.required && !isAutofillField}"
            ?disabled="${isAutofillField && isAutofillEnabled}"
            @input="${(e: Event) =>
              this._handleInputChange(e, String(field.id))}"
          ></textarea>
        `;
      }
      case "dropdown": {
        // GitHub Issue Forms dropdown with multiple and default support
        const isMultiple = (field.attributes as any)?.multiple === true;
        const defaultIndex = (field.attributes as any)?.default as number | undefined;
        
        // For multiple select, value is an array; for single select, it's a string
        const selectedValues: string[] = isMultiple 
          ? (Array.isArray(value) ? value : [])
          : (value ? [value] : []);

        // Get option labels for comparison
        const getOptionLabel = (opt: any): string => {
          return typeof opt === 'object' && opt !== null ? opt.label : String(opt);
        };

        // Initialize default value if not set and default index is provided
        if (!value && defaultIndex !== undefined && opts && Array.isArray(opts) && opts[defaultIndex]) {
          const defaultValue = getOptionLabel(opts[defaultIndex]);
          const currentData = getTabFormData(this.tabId);
          setTabFormData(this.tabId, {
            ...currentData,
            [String(field.id)]: isMultiple ? [defaultValue] : defaultValue,
          });
        }

        if (isMultiple) {
          // Multi-select dropdown
          return html`
            <select
              id="${String(field.id)}"
              multiple
              ?required="${field.validations?.required}"
              @change="${(e: Event) => {
                const select = e.target as HTMLSelectElement;
                const selected = Array.from(select.selectedOptions).map(opt => opt.value);
                const currentData = getTabFormData(this.tabId);
                setTabFormData(this.tabId, {
                  ...currentData,
                  [String(field.id)]: selected,
                });
              }}"
            >
              ${opts && isOptionObjectArray(opts)
                ? opts.map(
                    (opt) =>
                      html`<option 
                        value="${opt.label}" 
                        ?selected="${selectedValues.includes(opt.label)}"
                      >${opt.label}</option>`,
                  )
                : Array.isArray(opts)
                  ? opts.map(
                      (opt) => html`<option 
                        value="${opt}" 
                        ?selected="${selectedValues.includes(String(opt))}"
                      >${opt}</option>`,
                    )
                  : ""}
            </select>
          `;
        }

        // Single-select dropdown
        return html`
          <select
            id="${String(field.id)}"
            .value="${value}"
            ?required="${field.validations?.required}"
            @change="${(e: Event) =>
              this._handleInputChange(e, String(field.id))}"
          >
            <option value="" disabled ?selected="${!value}">Select an option</option>
            ${opts && isOptionObjectArray(opts)
              ? opts.map(
                  (opt, index) =>
                    html`<option 
                      value="${opt.label}" 
                      ?selected="${value === opt.label || (!value && defaultIndex === index)}"
                    >${opt.label}</option>`,
                )
              : Array.isArray(opts)
                ? opts.map(
                    (opt, index) => html`<option 
                      value="${opt}" 
                      ?selected="${value === opt || (!value && defaultIndex === index)}"
                    >${opt}</option>`,
                  )
                : ""}
          </select>
        `;
      }
      case "checkboxes": // GitHub Issue Forms (was checkbox group; multi-select)
        return html`
          <div class="checkboxes-group">
            ${opts && isOptionObjectArray(opts)
              ? opts.map(
                  (opt) => html`
                    <label class="${opt.required ? 'checkbox-required' : ''}">
                      <input
                        type="checkbox"
                        name="${String(field.id)}"
                        .checked="${(value || []).includes(String(opt.label))}"
                        ?required="${opt.required}"
                        @change="${(e: Event) => {
                          const checked = (e.target as HTMLInputElement)
                            .checked;
                          let arr = Array.isArray(value) ? [...value] : [];
                          if (checked) arr.push(opt.label);
                          else
                            arr = arr.filter(
                              (v) => String(v) !== String(opt.label),
                            );
                          const currentData = getTabFormData(this.tabId);
                          setTabFormData(this.tabId, {
                            ...currentData,
                            [String(field.id)]: arr,
                          });
                        }}"
                      />
                      ${opt.label}${opt.required ? html`<span class="required-indicator">*</span>` : ''}
                    </label>
                  `,
                )
              : Array.isArray(opts)
                ? opts.map(
                    (opt) => html`
                      <label>
                        <input
                          type="checkbox"
                          name="${String(field.id)}"
                          .checked="${(value || []).includes(
                            String(opt ?? ""),
                          )}"
                          @change="${(e: Event) => {
                            const checked = (e.target as HTMLInputElement)
                              .checked;
                            let arr = Array.isArray(value) ? [...value] : [];
                            if (checked) arr.push(opt);
                            else
                              arr = arr.filter(
                                (v) => String(v) !== String(opt),
                              );
                            const currentData = getTabFormData(this.tabId);
                            setTabFormData(this.tabId, {
                              ...currentData,
                              [String(field.id)]: arr,
                            });
                          }}"
                        />
                        ${opt}
                      </label>
                    `,
                  )
                : ""}
          </div>
        `;
      case "rating":
        return html`
          <wafir-rating
            .value="${Number(value) || 0}"
            .options="${field.attributes?.options || RATING_OPTIONS}"
            .icon="${field.attributes?.icon || RATING_ICON}"
            @rating-change="${(e: CustomEvent) => {
              const currentData = getTabFormData(this.tabId);
              setTabFormData(this.tabId, {
                ...currentData,
                [String(field.id)]: e.detail.value,
              });
            }}"
          ></wafir-rating>
        `;

      case "date":
        return html`
          <input
            type="date"
            id="${String(field.id)}"
            .value="${value}"
            ?required="${field.validations?.required}"
            @input="${(e: Event) =>
              this._handleInputChange(e, String(field.id))}"
          />
        `;

      case "input":
      case "email":
      default:
        return html`
          <input
            type="${field.type === "input" ? "text" : field.type}"
            id="${String(field.id)}"
            .value="${value}"
            placeholder="${field.attributes!.placeholder || ""}"
            ?required="${field.validations?.required}"
            @input="${(e: Event) =>
              this._handleInputChange(e, String(field.id))}"
          />
        `;
    }
  }

  render() {
    return html`
      <form @submit="${this._handleSubmit}">
        ${this.formLabel
          ? html`<h2 class="form-title">${this.formLabel}</h2>`
          : ""}
        ${this.fields.map((field) => {
          if (field.type === "checkboxes")
            return html`<div class="form-group">
              ${this._renderFieldInput(field)}
            </div>`;
          if (field.type === "markdown")
            return html`<div class="form-markdown-group">
              ${this._renderFieldInput(field)}
            </div>`;

          // Check for autofill attribute on textarea fields
          const autofill = (field.attributes as any)?.autofill;
          const isAutofillField = field.type === "textarea" && 
            (autofill === "browserInfo" || autofill === "consoleLog" || autofill === "screenshot");
          const isAutofillEnabled = this._autofillEnabled[String(field.id)] ?? false;

          if (isAutofillField) {
            const labelText = this._getAutofillLabel(autofill, field.attributes?.label);
            return html`
              <div class="form-group autofill-group">
                <label class="autofill-label">
                  <input
                    type="checkbox"
                    class="autofill-checkbox"
                    .checked="${isAutofillEnabled}"
                    @change="${(e: Event) => {
                      const checked = (e.target as HTMLInputElement).checked;
                      this._handleAutofillToggle(String(field.id), autofill, checked);
                    }}"
                  />
                  Include ${labelText}
                </label>
                ${this._renderFieldInput(field)}
              </div>
            `;
          }

          return html`
            <div class="form-group">
              <label for="${String(field.id)}">
                ${field.attributes?.label ?? field.id}
                ${field.validations?.required ? "*" : ""}
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
      </form>
    `;
  }
}
