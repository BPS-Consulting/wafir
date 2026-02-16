import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import ratingStyles from "./styles/wafir-rating.css?inline";
import { RATING_OPTIONS, RATING_ICON } from "./default-config.js";

@customElement("wafir-rating")
export class WafirRating extends LitElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Array })
  options: string[] = RATING_OPTIONS;

  @property({ type: String })
  icon: string = RATING_ICON;

  @state()
  private _hoverValue = 0;

  static styles = [unsafeCSS(ratingStyles)];

  /** Number of rating options (replaces fixed max of 5) */
  private get _max(): number {
    return this.options.length || 5;
  }

  private _handleClick(rating: number): void {
    if (this.readonly) return;

    this.value = rating;
    this.dispatchEvent(
      new CustomEvent("rating-change", {
        detail: { value: rating },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleMouseEnter(rating: number): void {
    if (this.readonly) return;
    this._hoverValue = rating;
  }

  private _handleMouseLeave(): void {
    this._hoverValue = 0;
  }

  private _handleKeyDown(e: KeyboardEvent, rating: number): void {
    if (this.readonly) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._handleClick(rating);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const newValue = Math.min(this.value + 1, this._max);
      this._handleClick(newValue);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const newValue = Math.max(this.value - 1, 1);
      this._handleClick(newValue);
    }
  }

  private _getLabelForRating(rating: number): string {
    if (this.options && this.options[rating - 1]) {
      return this.options[rating - 1];
    }
    return `${rating} of ${this._max}`;
  }

  render() {
    const displayValue = this._hoverValue || this.value;
    const hoverLabel =
      this._hoverValue > 0 ? this._getLabelForRating(this._hoverValue) : "";

    return html`
      <div
        class="rating ${this.readonly ? "readonly" : ""}"
        role="radiogroup"
        aria-label="Rating"
        @mouseleave="${this._handleMouseLeave}"
      >
        ${Array.from({ length: this._max }, (_, i) => {
          const rating = i + 1;
          const isFilled = rating <= displayValue;
          const isActive = rating <= this.value;

          return html`
            <button
              type="button"
              class="rating-icon ${isFilled ? "filled" : ""} ${isActive
                ? "active"
                : ""}"
              role="radio"
              aria-checked="${isActive}"
              aria-label="${this._getLabelForRating(rating)}"
              tabindex="${rating === 1 || rating === this.value ? 0 : -1}"
              ?disabled="${this.readonly}"
              @click="${() => this._handleClick(rating)}"
              @mouseenter="${() => this._handleMouseEnter(rating)}"
              @keydown="${(e: KeyboardEvent) => this._handleKeyDown(e, rating)}"
            >
              <span class="icon-char">${this.icon}</span>
            </button>
          `;
        })}
        ${hoverLabel
          ? html`<span class="rating-text hover-label">${hoverLabel}</span>`
          : this.value > 0
            ? html`<span class="rating-text"
                >${this._getLabelForRating(this.value)}</span
              >`
            : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-rating": WafirRating;
  }
}
