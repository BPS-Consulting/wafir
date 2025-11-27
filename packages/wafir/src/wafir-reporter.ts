import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
// Assuming this file contains both Tailwind base/utilities AND DaisyUI setup
import globalStyles from "./index.css?inline";

// Define the valid positions for the widget
type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/**
 * A DaisyUI-styled reporter widget.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("wafir-reporter")
export class MyElement extends LitElement {
  @property({ type: String })
  buttonText = "Open Form Widget";

  @property({ type: String })
  modalTitle = "Contact Us";

  /**
   * Defines the fixed position of the widget button.
   */
  @property({ type: String })
  position: WidgetPosition = "bottom-right"; // Default position

  @state()
  isModalOpen = false;

  @state()
  formData = { name: "", email: "" };

  // Inject global styles (including Tailwind/DaisyUI)
  // AND add custom CSS to handle the fixed positioning of the button.
  static styles = [
    unsafeCSS(globalStyles),
    css`
      /* The host container is hidden by default. We want to style the content inside. */
      :host {
        display: block;
      }

      /* Styles for the fixed position container for the trigger button */
      .fixed-trigger {
        position: fixed;
        z-index: 999; /* Below the modal z-index */
      }

      /* Positioning map based on the 'position' property */
      .bottom-right {
        bottom: 1.5rem; /* Tailwind equivalent: bottom-6 */
        right: 1.5rem; /* Tailwind equivalent: right-6 */
      }
      .bottom-left {
        bottom: 1.5rem;
        left: 1.5rem;
      }
      .top-right {
        top: 1.5rem;
        right: 1.5rem;
      }
      .top-left {
        top: 1.5rem;
        left: 1.5rem;
      }
    `,
  ];

  // Renamed for clarity: this is the action when the *trigger* is clicked
  private _handleTriggerClick() {
    this.isModalOpen = !this.isModalOpen;
  }

  // New explicit function to close the modal
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
      // Use standard browser alert for simplicity in this example
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
    // Use the explicit close function
    this._closeModal();
    this.formData = { name: "", email: "" };

    alert(`Thank you, ${submittedName}! Your request has been sent.`);
  }

  // --- Template (HTML) ---

  render() {
    const isFormValid =
      this.formData.name.trim() !== "" && this.formData.email.trim() !== "";

    // Class for positioning the button
    const positionClass = this.position;

    // DaisyUI classes for the submit button
    const submitButtonClasses = `btn btn-primary btn-block mt-4`;

    // DaisyUI classes for the trigger button, inside the fixed container
    const triggerButtonClasses = `btn btn-primary`;

    // DaisyUI classes for the form inputs
    const inputClasses = `input input-bordered w-full`;

    return html`
      <!-- Widget Trigger Button Container (Handles fixed positioning) -->
      <div class="fixed-trigger ${positionClass}" data-theme="light">
        <button
          class="${triggerButtonClasses}"
          @click="${this._handleTriggerClick}"
          part="button"
        >
          ${this.buttonText}
        </button>
      </div>

      <!-- Modal Content (Conditional Rendering) -->
      ${this.isModalOpen
        ? html`
            <!-- DaisyUI Modal: Use _closeModal for backdrop click -->
            <div
              class="modal ${this.isModalOpen ? "modal-open" : ""}"
              role="dialog"
              @click="${this._closeModal}"
              data-theme="light"
            >
              <!-- DaisyUI Modal Box: modal-box provides styling (bg, shadow, padding) -->
              <div
                class="modal-box max-w-lg relative"
                @click="${(e: Event) => e.stopPropagation()}"
              >
                <!-- Header -->
                <div
                  class="flex justify-between items-center mb-4 pb-4 border-b border-base-200"
                >
                  <!-- Title -->
                  <h3 id="modal-title" class="text-2xl font-bold">
                    ${this.modalTitle}
                  </h3>
                  <!-- Close Button (DaisyUI style) -->
                  <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    @click="${this._closeModal}"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                <!-- Form -->
                <form
                  class="flex flex-col space-y-4"
                  @submit="${this._handleSubmit}"
                >
                  <!-- Name Field -->
                  <div class="form-control w-full">
                    <label for="name" class="label">
                      <span class="label-text">Name</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      class="${inputClasses}"
                      .value="${this.formData.name}"
                      @input="${this._handleInputChange}"
                      required
                    />
                  </div>

                  <!-- Email Field -->
                  <div class="form-control w-full">
                    <label for="email" class="label">
                      <span class="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="${inputClasses}"
                      .value="${this.formData.email}"
                      @input="${this._handleInputChange}"
                      required
                    />
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    class="${submitButtonClasses}"
                    .disabled="${!isFormValid}"
                  >
                    Send Message
                  </button>
                </form>
              </div>
              <!-- Use _closeModal for the modal-backdrop form as well -->
              <form
                method="dialog"
                class="modal-backdrop"
                @click="${this._closeModal}"
              >
                <button>close</button>
              </form>
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
