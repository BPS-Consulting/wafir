import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import starRatingStyles from "./styles/wafir-star-rating.css?inline";

@customElement("wafir-star-rating")
export class WafirStarRating extends LitElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 5;

  @property({ type: Boolean })
  readonly = false;

  @state()
  private _hoverValue = 0;

  static styles = [unsafeCSS(starRatingStyles)];

  private _handleClick(rating: number) {
    if (this.readonly) return;

    this.value = rating;
    this.dispatchEvent(
      new CustomEvent("rating-change", {
        detail: { value: rating },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleMouseEnter(rating: number) {
    if (this.readonly) return;
    this._hoverValue = rating;
  }

  private _handleMouseLeave() {
    this._hoverValue = 0;
  }

  private _handleKeyDown(e: KeyboardEvent, rating: number) {
    if (this.readonly) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._handleClick(rating);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const newValue = Math.min(this.value + 1, this.max);
      this._handleClick(newValue);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const newValue = Math.max(this.value - 1, 1);
      this._handleClick(newValue);
    }
  }

  render() {
    const displayValue = this._hoverValue || this.value;

    return html`
      <div
        class="star-rating ${this.readonly ? "readonly" : ""}"
        role="radiogroup"
        aria-label="Rating"
        @mouseleave="${this._handleMouseLeave}"
      >
        ${Array.from({ length: this.max }, (_, i) => {
          const rating = i + 1;
          const isFilled = rating <= displayValue;
          const isActive = rating <= this.value;

          return html`
            <button
              type="button"
              class="star ${isFilled ? "filled" : ""} ${isActive
                ? "active"
                : ""}"
              role="radio"
              aria-checked="${isActive}"
              aria-label="${rating} star${rating !== 1 ? "s" : ""}"
              tabindex="${rating === 1 || rating === this.value ? 0 : -1}"
              ?disabled="${this.readonly}"
              @click="${() => this._handleClick(rating)}"
              @mouseenter="${() => this._handleMouseEnter(rating)}"
              @keydown="${(e: KeyboardEvent) => this._handleKeyDown(e, rating)}"
            >
              <svg
                viewBox="0 0 24 24"
                fill="${isFilled ? "currentColor" : "none"}"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </button>
          `;
        })}
        ${this.value > 0
          ? html`<span class="rating-text">${this.value} / ${this.max}</span>`
          : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-star-rating": WafirStarRating;
  }
}
