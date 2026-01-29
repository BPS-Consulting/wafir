// Copyright (c) BPS-Consulting. Licensed under the AGPLv3 License.
import { LitElement, html, unsafeCSS } from "lit";
import formStyles from "./styles/wafir-form.css?inline";
import "./star-rating.js";
import { customElement, property } from "lit/decorators.js";
import { StoreController } from "@nanostores/lit";
import { formData, setFormData, browserInfo, consoleLogs } from "./store";
import type { FieldConfigApi as FieldConfig } from "./api/client";

@customElement("wafir-form")
export class WafirForm extends LitElement {
  private _fields: FieldConfig[] = [];

  @property({ type: Array })
  get fields(): FieldConfig[] {
    return this._fields;
  }
  set fields(val: FieldConfig[]) {
    this._fields = val || [];
  }

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
        if (field.attributes!.value && !newData[String(field.id) || ""]) {
          newData[String(field.id) || ""] = field.attributes!.value;
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
  // Render form field input for all supported types
  private _renderFieldInput(field: FieldConfig) {
    const value = this._formDataController.value[String(field.id)] || "";

    // Helper: options can be string[] OR {label:string}[]
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
      case "textarea":
        return html`
          <textarea
            id="${String(field.id)}"
            .value="${value}"
            placeholder="${field.attributes!.placeholder || ""}"
            ?required="${field.validations?.required}"
            @input="${(e: Event) =>
              this._handleInputChange(e, String(field.id))}"
          ></textarea>
        `;

      case "dropdown": // GitHub Issue Forms (was select)
        return html`
          <select
            id="${String(field.id)}"
            .value="${value}"
            ?required="${field.validations?.required}"
            @change="${(e: Event) =>
              this._handleInputChange(e, String(field.id))}"
          >
            <option value="" disabled selected>Select an option</option>
            ${opts && isOptionObjectArray(opts)
              ? opts.map(
                  (opt) =>
                    html`<option value="${opt.label}">${opt.label}</option>`,
                )
              : Array.isArray(opts)
                ? opts.map(
                    (opt) => html`<option value="${opt}">${opt}</option>`,
                  )
                : ""}
          </select>
        `;

      case "checkboxes": // GitHub Issue Forms (was checkbox group; multi-select)
        return html`
          <div class="checkboxes-group">
            ${opts && isOptionObjectArray(opts)
              ? opts.map(
                  (opt) => html`
                    <label>
                      <input
                        type="checkbox"
                        name="${String(field.id)}"
                        .checked="${(value || []).includes(String(opt.label))}"
                        @change="${(e: Event) => {
                          const checked = (e.target as HTMLInputElement)
                            .checked;
                          let arr = Array.isArray(value) ? [...value] : [];
                          if (checked) arr.push(opt.label);
                          else
                            arr = arr.filter(
                              (v) => String(v) !== String(opt.label),
                            );
                          setFormData({
                            ...formData.get(),
                            [String(field.id)]: arr,
                          });
                        }}"
                      />
                      ${opt.label}
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
                            setFormData({
                              ...formData.get(),
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
          <wafir-star-rating
            .value="${Number(value) || 0}"
            .labels="${field.attributes!.ratingLabels || []}"
            @rating-change="${(e: CustomEvent) => {
              setFormData({
                ...formData.get(),
                [String(field.id)]: e.detail.value,
              });
            }}"
          ></wafir-star-rating>
        `;

      case "input":
      case "email":
      default:
        return html`
          <input
            type="${field.type}"
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
        ${this.fields.map((field) => {
          // (hidden is not in API schema, so this check is skipped)
          // (was: if (field.type === "checkbox"))
          if (field.type === "checkboxes")
            return html`<div class="form-group">
              ${this._renderFieldInput(field)}
            </div>`;

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
