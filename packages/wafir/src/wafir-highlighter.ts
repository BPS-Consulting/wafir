import { LitElement, html, unsafeCSS } from "lit";
import highlighterStyles from "./styles/wafir-highlighter.css?inline";
import { customElement, state } from "lit/decorators.js";
import { isSelecting, hoveredElement, stopSelection } from "./store";
import { StoreController } from "@nanostores/lit";
import { takeFullPageScreenshot } from "./utils/screenshot";

@customElement("wafir-highlighter")
export class WafirHighlighter extends LitElement {
  private _isSelectingController = new StoreController(this, isSelecting);
  private _hoveredElementController = new StoreController(this, hoveredElement);

  @state()
  private _rect: DOMRect | null = null;

  static styles = [unsafeCSS(highlighterStyles)];

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._handleKeyDown);
  }

  private _handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isSelecting.get()) {
      stopSelection();
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    if (!isSelecting.get()) return;

    // Hide overlay momentarily to get the element underneath
    const target = this.shadowRoot?.querySelector(".overlay") as HTMLElement;
    if (target) target.style.pointerEvents = "none";

    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;

    if (target) target.style.pointerEvents = "auto";

    if (el && !this._isWafirElement(el)) {
      hoveredElement.set(el);
      this._rect = el.getBoundingClientRect();
    } else {
      hoveredElement.set(null);
      this._rect = null;
    }
  };

  private _isWafirElement(el: HTMLElement): boolean {
    let current: HTMLElement | null = el;
    while (current) {
      if (current.tagName.toLowerCase().startsWith("wafir-")) return true;
      if (current.parentElement) {
        current = current.parentElement;
      } else if ((current.getRootNode() as ShadowRoot).host) {
        current = (current.getRootNode() as ShadowRoot).host as HTMLElement;
      } else {
        break;
      }
    }
    return false;
  }

  private async _handleClick() {
    const el = hoveredElement.get();
    if (el) {
      await takeFullPageScreenshot(el);
      stopSelection();
    }
  }

  render() {
    if (!this._isSelectingController.value) return html``;

    return html`
      <div
        class="overlay"
        @mousemove="${this._handleMouseMove}"
        @click="${this._handleClick}"
      ></div>
      ${this._rect
        ? html`
            <div
              class="highlight"
              style="
                    top: ${this._rect.top}px;
                    left: ${this._rect.left}px;
                    width: ${this._rect.width}px;
                    height: ${this._rect.height}px;
                "
            >
              <div class="label">
                ${this._hoveredElementController.value?.tagName.toLowerCase()}
                ${this._rect.width.toFixed(0)}x${this._rect.height.toFixed(0)}
              </div>
            </div>
          `
        : ""}
    `;
  }
}
