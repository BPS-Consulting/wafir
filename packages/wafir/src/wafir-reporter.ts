// wafir-reporter.ts
import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { WafirModal } from "./wafir-modal";
import { WafirRoot } from "./wafir-root";

@customElement("wafir-reporter")
export class WafirReporter extends WafirRoot {
  @property({ type: String })
  buttonText = "Open Form Widget";

  @property({ type: String })
  modalTitle = "Contact Us";

  @state()
  isModalOpen = false;

  @state()
  formData = { name: "", email: "" };

  private _openModal = () => {
    this.isModalOpen = true;
  };

  private _handleModalClose = () => {
    this.isModalOpen = false;
  };

  private _handleFormSubmit(event: CustomEvent) {
    console.log("Form Submitted to Parent:", event.detail.formData);
  }

  render() {
    return html`
      <div data-theme="light">
        <!-- Widget Trigger Button - using DaisyUI 'btn' class -->
        <button class="btn btn-primary" @click="${this._openModal}">
          ${this.buttonText}
        </button>

        <!-- The Modal Component -->
        <wafir-modal
          .isOpen="${this.isModalOpen}"
          .modalTitle="${this.modalTitle}"
          @modal-close="${this._handleModalClose}"
          @form-submit="${this._handleFormSubmit}"
        ></wafir-modal>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-reporter": WafirReporter;
    "wafir-modal": WafirModal;
  }
}
