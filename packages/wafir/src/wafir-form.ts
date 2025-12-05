import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

interface FormData {
  name: string;
  email: string;
}

@customElement("wafir-form")
export class WafirForm extends LitElement {
  @state()
  formData: FormData = { name: "", email: "" };

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

    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
      transition: all 0.2s ease;
      margin-top: 8px;
    }

    .submit-button:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .submit-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }
  `;

  private _handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const { name, value } = target;
    this.formData = {
      ...this.formData,
      [name]: value,
    };
  }

  private _handleSubmit(event: Event) {
    event.preventDefault();

    if (!this.formData.name || !this.formData.email) {
      alert("Please fill out all fields.");
      return;
    }

    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: this.formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const isFormValid =
      this.formData.name.trim() !== "" && this.formData.email.trim() !== "";

    return html`
      <form @submit="${this._handleSubmit}">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            .value="${this.formData.name}"
            @input="${this._handleInputChange}"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            .value="${this.formData.email}"
            @input="${this._handleInputChange}"
            required
          />
        </div>

        <button class="submit-button" type="submit" .disabled="${!isFormValid}">
          Send Message
        </button>
      </form>
    `;
  }
}
