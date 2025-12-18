import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { FieldConfig } from "./types"; // Assuming you saved the interface above

@customElement("wafir-form")
export class WafirForm extends LitElement {
  // Receive the configuration from the parent
  @property({ type: Array })
  fields: FieldConfig[] = [];

  @state()
  formData: Record<string, any> = {};

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
  `;

  // Initialize default values when fields are loaded
  willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has("fields")) {
      this.fields.forEach((field) => {
        if (field.defaultValue && !this.formData[field.id]) {
          this.formData[field.id] = field.defaultValue;
        }
      });
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

    this.formData = { ...this.formData, [fieldId]: value };
    this.requestUpdate(); // Force re-render to check validation state
  }

  private _handleSubmit(event: Event) {
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: this.formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Helper to render specific input types
  private _renderFieldInput(field: FieldConfig) {
    const value = this.formData[field.id] || "";

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
      </form>
    `;
  }
}
