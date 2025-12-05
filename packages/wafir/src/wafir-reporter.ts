import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import globalStyles from "./index.css?inline";
import bugIcon from "./assets/bug.svg?raw";

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
  formData = { name: "", email: "" };

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

      /* Form */
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

      /* Submit button */
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
    `,
  ];

  private _handleTriggerClick() {
    this.isModalOpen = !this.isModalOpen;
  }

  private _closeModal() {
    this.isModalOpen = false;
  }

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

    console.log("Form Submitted:", this.formData);

    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: this.formData },
        bubbles: true,
        composed: true,
      })
    );

    const submittedName = this.formData.name;
    this._closeModal();
    this.formData = { name: "", email: "" };

    alert(`Thank you, ${submittedName}! Your request has been sent.`);
  }

  render() {
    const isFormValid =
      this.formData.name.trim() !== "" && this.formData.email.trim() !== "";

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

                  <button
                    class="submit-button"
                    type="submit"
                    .disabled="${!isFormValid}"
                  >
                    Send Message
                  </button>
                </form>
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
