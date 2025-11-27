import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
// Assuming this file contains UnoCSS base/preflight/utilities
import globalStyles from "./index.css?inline";
import bugIcon from "./assets/bug.svg?raw";

// Define the valid positions for the widget
type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/**
 * An UnoCSS styled reporter widget.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("wafir-reporter")
export class MyElement extends LitElement {
  @property({ type: String })
  buttonText = "";

  @property({ type: String })
  modalTitle = "Contact Us";

  /**
   * Defines the fixed position of the widget button.
   */
  @property({ type: String })
  position: WidgetPosition = "bottom-right"; // Default position

  /**
   * The text to display in the tooltip over the button.
   */
  @property({ type: String })
  tooltipText = "Open Issue Reporter";

  @state()
  isModalOpen = false;

  @state()
  formData = { name: "", email: "" };

  // Inject global styles (UnoCSS preflight/utilities)
  // AND add custom CSS for fixed positioning and icon sizing.
  static styles = [
    unsafeCSS(globalStyles), // Inject UnoCSS generated styles
    css`
      /* === Component-Specific CSS (for Shadow DOM scope) === */
      :host {
        display: block;
      }

      /* Styles for the fixed position container for the trigger button */
      .fixed-trigger {
        position: fixed;
        z-index: 999;
      }

      /* Positioning map based on the 'position' property */
      .bottom-right {
        bottom: 1.5rem;
        right: 1.5rem;
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

      /* Style for the SVG icon inside the button to ensure it scales correctly */
      .icon-button-content svg {
        width: 1.5rem; /* Equivalent to w-6 */
        height: 1.5rem; /* Equivalent to h-6 */
        fill: currentColor;
      }

      @unocss-placeholder;
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

  // --- Template (HTML) ---

  render() {
    const isFormValid =
      this.formData.name.trim() !== "" && this.formData.email.trim() !== "";

    const positionClass = this.position;

    // UnoCSS utility classes for components
    const submitButtonClasses = `w-full bg-blue-600 text-white p-3 rounded-md mt-4 transition-colors font-semibold cursor-pointer
      hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed`;

    const triggerButtonClasses = `w-14 h-14 rounded-full bg-blue-600 text-white p-0 flex items-center justify-center 
      shadow-xl cursor-pointer hover:bg-blue-700 transition-colors border-none`;

    const inputClasses = `p-3 border border-gray-300 rounded-md text-gray-800 bg-white w-full 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`;

    // UnoCSS/Tailwind classes for the tooltip container (assuming the default UnoCSS behavior)
    // NOTE: Tailwind/UnoCSS doesn't have a native 'tooltip' component like DaisyUI.
    // We'll use a simplified utility setup for hover state and position.
    // For a complex, accessible tooltip, you'd usually use a library or a fully custom CSS class.
    const tooltipContainerClasses = `relative group`;
    const tooltipTextClasses = `absolute right-full top-1/2 transform -translate-y-1/2 -mr-3 
      bg-gray-800 text-white text-sm p-2 rounded-md whitespace-nowrap 
      invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 z-100`;

    return html`
      <!-- Widget Trigger Button Container (Handles fixed positioning) -->
      <div class="fixed-trigger ${positionClass}">
        <!-- UnoCSS Tooltip Container -->
        <div class="${tooltipContainerClasses}">
          <button
            class="${triggerButtonClasses}"
            @click="${this._handleTriggerClick}"
            part="button"
            aria-label="${this.tooltipText}"
          >
            <!-- Inject the SVG Icon -->
            <span class="icon-button-content"> ${unsafeHTML(bugIcon)} </span>
          </button>

          <!-- Tooltip Text -->
          <div class="${tooltipTextClasses}">${this.tooltipText}</div>
        </div>
      </div>

      <!-- Modal Content (Conditional Rendering) -->
      ${this.isModalOpen
        ? html`
            <!-- Modal Overlay: fixed inset-0 bg-black/60 flex... z-1000 -->
            <div
              class="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4"
              role="dialog"
              @click="${this._closeModal}"
              aria-modal="true"
            >
              <!-- Modal Dialog: bg-white p-6 max-w-lg w-full shadow-2xl rounded-xl text-gray-800 -->
              <div
                class="bg-white/100 p-6 max-w-lg w-full relative shadow-2xl rounded-xl text-gray-800"
                @click="${(e: Event) => e.stopPropagation()}"
              >
                <!-- Header -->
                <div
                  class="flex justify-between items-center pb-4 mb-4 border-b border-gray-200"
                >
                  <!-- Title -->
                  <h3 id="modal-title" class="text-2xl font-bold">
                    ${this.modalTitle}
                  </h3>
                  <!-- Close Button -->
                  <button
                    class="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
                    @click="${this._closeModal}"
                    aria-label="Close modal"
                  >
                    &times;
                  </button>
                </div>

                <!-- Form -->
                <form
                  class="flex flex-col space-y-4"
                  @submit="${this._handleSubmit}"
                >
                  <!-- Name Field -->
                  <div class="flex flex-col space-y-1">
                    <label for="name" class="text-sm font-medium">Name</label>
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
                  <div class="flex flex-col space-y-1">
                    <label for="email" class="text-sm font-medium">Email</label>
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
