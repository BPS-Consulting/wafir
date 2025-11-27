import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { WafirRoot } from "./wafir-root";

/**
 * A DaisyUI-styled modal with a simple contact form.
 */
@customElement("wafir-modal")
export class WafirModal extends WafirRoot {
  // Use property for attributes passed from the parent
  @property({ type: Boolean })
  isOpen: boolean = false;

  @property({ type: String })
  modalTitle: string = "Contact Us";

  // State for the form data
  @state()
  formData = { name: "", email: "" };

  private _handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const { name, value } = target;
    this.formData = {
      ...this.formData,
      [name]: value,
    };
  }

  private _handleClose() {
    // Dispatch a custom event to the parent to close the modal
    this.dispatchEvent(new CustomEvent("modal-close"));
  }

  private _handleSubmit(event: Event) {
    event.preventDefault();

    if (!this.formData.name || !this.formData.email) {
      alert("Please fill out all fields.");
      return;
    }

    // Dispatch a custom event for form submission
    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: this.formData },
        bubbles: true,
        composed: true,
      })
    );

    // Reset form data locally after dispatch
    const submittedName = this.formData.name;
    this.formData = { name: "", email: "" };
    alert(`Thank you, ${submittedName}! Your request has been sent.`);

    // Close the modal
    this._handleClose();
  }

  render() {
    const isFormValid =
      this.formData.name.trim() !== "" && this.formData.email.trim() !== "";

    // The 'modal-open' class is conditionally applied based on the 'isOpen' property
    const modalClass = `modal ${this.isOpen ? "modal-open" : ""}`;

    return html`
      <div class="${modalClass}">
        <!-- modal-backdrop: click on it calls _handleClose -->
        <div class="modal-backdrop" @click="${this._handleClose}"></div>

        <!-- modal-box: the modal content container -->
        <div class="modal-box w-11/12 max-w-lg">
          <h3 class="font-bold text-lg">${this.modalTitle}</h3>

          <!-- Close button -->
          <button
            class="btn btn-sm btn-circle absolute right-2 top-2"
            @click="${this._handleClose}"
            aria-label="Close modal"
          >
            ✕
          </button>

          <div class="py-4">
            <form class="space-y-4" @submit="${this._handleSubmit}">
              <!-- Name Field -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  class="input input-bordered w-full"
                  .value="${this.formData.name}"
                  @input="${this._handleInputChange}"
                  required
                />
              </div>

              <!-- Email Field -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  class="input input-bordered w-full"
                  .value="${this.formData.email}"
                  @input="${this._handleInputChange}"
                  required
                />
              </div>

              <!-- Submit Button -->
              <div class="modal-action">
                <button
                  type="submit"
                  class="btn btn-primary w-full"
                  .disabled="${!isFormValid}"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }
}
