import { unsafeCSS as ie, LitElement as se, html as m } from "lit";
import { property as S, state as E, customElement as ae } from "lit/decorators.js";
import { unsafeHTML as Ce } from "lit/directives/unsafe-html.js";
const nt = 'html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button}button::-moz-focus-inner,[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}:host{font-family:var( --wafir-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif );font-size:var(--wafir-font-size, 14px);text-align:left;color:var(--wafir-text-color, #111827);line-height:1.5}.trigger-container{position:fixed;z-index:9998}.trigger-container.bottom-right{bottom:var(--wafir-button-offset, 20px);right:var(--wafir-button-offset, 20px)}.trigger-container.bottom-left{bottom:var(--wafir-button-offset, 20px);left:var(--wafir-button-offset, 20px)}.trigger-container.top-right{top:var(--wafir-button-offset, 20px);right:var(--wafir-button-offset, 20px)}.trigger-container.top-left{top:var(--wafir-button-offset, 20px);left:var(--wafir-button-offset, 20px)}button[part=button]{width:var(--wafir-button-size, 48px);height:var(--wafir-button-size, 48px);border-radius:var(--wafir-button-border-radius, 50%);background:var(--wafir-primary-color, #2563eb);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--wafir-button-shadow, 0 4px 12px rgba(0, 0, 0, .15));transition:all .2s ease}button[part=button]:hover{background:var(--wafir-primary-hover, #1d4ed8);transform:scale(1.05);box-shadow:var(--wafir-button-shadow-hover, 0 6px 16px rgba(0, 0, 0, .2))}button[part=button] span{display:flex;align-items:center;justify-content:center;width:var(--wafir-button-icon-size, 24px);height:var(--wafir-button-icon-size, 24px)}button[part=button] svg{width:var(--wafir-button-icon-size, 24px);height:var(--wafir-button-icon-size, 24px);stroke:#fff}.tooltip{position:absolute;bottom:60px;right:0;background:var(--wafir-tooltip-bg, #1f2937);color:#fff;padding:6px 10px;border-radius:6px;font-size:12px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s ease}.trigger-container:hover .tooltip{opacity:1}.modal-backdrop{position:fixed;inset:0;background:var(--wafir-backdrop-color, rgba(0, 0, 0, .5));display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn .2s ease}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}.modal-content{background:var(--wafir-modal-bg, white);border-radius:var(--wafir-modal-border-radius, 12px);width:90%;max-width:var(--wafir-modal-max-width, 800px);max-height:90vh;overflow-y:auto;box-shadow:var(--wafir-modal-shadow, 0 20px 60px rgba(0, 0, 0, .3));animation:slideUp .3s ease}@keyframes slideUp{0%{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}.modal-header{display:flex;justify-content:space-between;align-items:center;padding:var(--wafir-modal-padding, 20px);border-bottom:1px solid var(--wafir-border-color, #e5e7eb)}.modal-header h3{margin:0;font-size:var(--wafir-modal-title-font-size, 18px);font-weight:var(--wafir-modal-title-font-weight, 600);color:var(--wafir-modal-title-color, var(--wafir-text-color, #111827))}.close-button{background:none;border:none;font-size:28px;color:var(--wafir-text-secondary, #6b7280);cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:all .2s ease}.close-button:hover{background:#f3f4f6;color:var(--wafir-text-color, #111827)}.mode-tabs{display:flex;gap:0;border-bottom:1px solid var(--wafir-border-color, #e5e7eb)}.mode-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-size:14px;font-weight:500;color:var(--wafir-text-secondary, #6b7280);transition:all .2s ease}.mode-tab:hover{background:var(--wafir-form-bg-tertiary, #f9fafb);color:var(--wafir-text-color, #111827)}.mode-tab.active{color:var(--wafir-primary-color, #2563eb);border-bottom-color:var(--wafir-primary-color, #2563eb)}.mode-tab svg{width:18px;height:18px;stroke:currentColor}', it = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bug-icon lucide-bug"><path d="M12 20v-9"/><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"/><path d="M14.12 3.88 16 2"/><path d="M21 21a4 4 0 0 0-3.81-4"/><path d="M21 5a4 4 0 0 1-3.55 3.97"/><path d="M22 13h-4"/><path d="M3 21a4 4 0 0 1 3.81-4"/><path d="M3 5a4 4 0 0 0 3.55 3.97"/><path d="M6 13H2"/><path d="m8 2 1.88 1.88"/><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"/></svg>', Le = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="24"
   height="24"
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   stroke-width="2"
   stroke-linecap="round"
   stroke-linejoin="round"
   class="lucide lucide-message-square-icon lucide-message-square"
   version="1.1"
   id="svg1"
   sodipodi:docname="thumbsup.svg"
   inkscape:version="1.4.2 (f4327f4, 2025-05-13)"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <defs
     id="defs1" />
  <sodipodi:namedview
     id="namedview1"
     pagecolor="#ffffff"
     bordercolor="#000000"
     borderopacity="0.25"
     inkscape:showpageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="0"
     inkscape:deskcolor="#d1d1d1"
     inkscape:zoom="77.541667"
     inkscape:cx="12"
     inkscape:cy="12"
     inkscape:window-width="3840"
     inkscape:window-height="2126"
     inkscape:window-x="3829"
     inkscape:window-y="-11"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg1" />
  <path
     d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
     id="path1" />
  <path
     d="M 13.373895,7.8707208 12.88154,9.8992235 h 2.870429 a 0.98471004,0.98471004 0 0 1 0.945322,1.2604285 l -1.147188,3.938841 a 0.98471004,0.98471004 0 0 1 -0.945321,0.708991 H 7.9579893 a 0.98471004,0.98471004 0 0 1 -0.9847101,-0.98471 v -3.93884 A 0.98471004,0.98471004 0 0 1 7.9579893,9.8992235 H 9.3168891 A 0.98471004,0.98471004 0 0 0 10.198205,9.3527094 l 1.698624,-3.392326 a 1.5410712,1.5410712 0 0 1 1.477066,1.9103374 z"
     id="path1-8"
     style="stroke-width:0.98471" />
  <path
     d="M 9.4350543,9.8992235 V 15.807484"
     id="path2"
     style="stroke-width:0.98471" />
</svg>
`, st = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
`, at = "html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button}button::-moz-focus-inner,[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}:host{display:block;color:var(--wafir-form-text-color, #374151);background-color:var(--wafir-form-bg, transparent);line-height:1.5}form{padding:var(--wafir-form-padding, 20px)}.form-group{margin-bottom:16px}label{display:block;margin-bottom:6px;font-weight:500;color:var(--wafir-form-text-color, #374151);font-size:13px}input,textarea,select{width:100%;padding:var(--wafir-form-input-padding, 10px 12px);border:1px solid var(--wafir-form-border-color, #d1d5db);border-radius:var(--wafir-form-border-radius, 6px);font-size:14px;box-sizing:border-box;font-family:inherit;color:var(--wafir-form-input-color, #111827);background-color:var(--wafir-form-input-bg, #ffffff)}textarea{min-height:80px;resize:vertical}.checkbox-group{display:flex;align-items:center;gap:8px}.checkbox-group input{width:auto}.checkbox-group label{margin-bottom:0}.submit-button{width:100%;padding:10px;background:var(--wafir-form-primary-color, #2563eb);color:#fff;border:none;border-radius:var(--wafir-form-border-radius, 6px);font-size:14px;font-weight:500;cursor:pointer;margin-top:8px}.submit-button:hover{background:var(--wafir-form-primary-hover, #1d4ed8)}.submit-button:disabled{background:var(--wafir-form-disabled-color, #9ca3af);cursor:not-allowed}.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:6px}@keyframes spin{to{transform:rotate(360deg)}}.screenshot-preview{margin-top:8px;position:relative;border:1px solid var(--wafir-form-border-color, #d1d5db);border-radius:var(--wafir-form-border-radius, 6px);overflow:hidden;max-height:200px;display:flex;justify-content:center;background:var(--wafir-form-bg-tertiary, #f9fafb)}.screenshot-preview img{max-width:100%;height:auto;object-fit:contain}.screenshot-clear{position:absolute;top:5px;right:5px;background:#00000080;color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px}.capture-button{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:8px;background:var(--wafir-form-bg-secondary, #f3f4f6);border:1px dashed var(--wafir-form-border-color, #d1d5db);border-radius:var(--wafir-form-border-radius, 6px);font-size:13px;cursor:pointer;color:var(--wafir-form-text-color, #374151);transition:all .2s}.capture-button:hover{background:#e5e7eb;border-color:var(--wafir-form-disabled-color, #9ca3af)}.screenshot-actions{display:flex;gap:8px;margin-top:8px}.screenshot-actions button{flex:1;padding:6px;font-size:12px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;border:1px solid var(--wafir-form-border-color, #d1d5db);background:var(--wafir-form-bg-tertiary, #f9fafb)}.screenshot-actions button:hover{background:var(--wafir-form-bg-secondary, #f3f4f6)}.screenshot-actions .highlight-btn{color:var(--wafir-form-primary-color, #2563eb);border-color:var(--wafir-form-primary-color, #2563eb);background:#eff6ff}.screenshot-actions .highlight-btn:hover{background:#dbeafe}.telemetry-section{margin-top:16px;padding:12px;background:var(--wafir-form-telemetry-bg, #f9fafb);border:1px solid var(--wafir-form-telemetry-border, #e5e7eb);border-radius:var(--wafir-form-border-radius, 6px);font-size:12px;color:#4b5563}.telemetry-section h4{margin:0 0 8px;font-size:13px;color:var(--wafir-form-text-color, #374151);font-weight:600}.telemetry-grid{display:grid;grid-template-columns:auto 1fr;gap:4px 12px}.telemetry-label{font-weight:500;color:var(--wafir-form-text-secondary, #6b7280)}.logs-container{max-height:150px;overflow-y:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;background:var(--wafir-form-logs-bg, #111827);color:var(--wafir-form-logs-text, #f3f4f6);padding:8px;border-radius:4px}.log-item{margin-bottom:4px;word-break:break-all}.log-warn{color:var(--wafir-form-log-warn, #fde047)}.log-error{color:var(--wafir-form-log-error, #f87171)}.switch-container{display:flex;background:var(--wafir-form-bg-secondary, #f3f4f6);border-radius:var(--wafir-form-border-radius, 6px);padding:4px;gap:4px}.switch-option{flex:1;padding:8px 16px;border:none;border-radius:calc(var(--wafir-form-border-radius, 6px) - 2px);font-size:13px;font-weight:500;cursor:pointer;background:transparent;color:var(--wafir-form-text-secondary, #6b7280);transition:all .2s ease}.switch-option:hover:not(.active){color:var(--wafir-form-text-color, #374151)}.switch-option.active{background:var(--wafir-form-input-bg, #ffffff);color:var(--wafir-form-primary-color, #2563eb);box-shadow:0 1px 3px #0000001a}", lt = ".star-rating{display:inline-flex;align-items:center;gap:4px}.star-rating.readonly{pointer-events:none}.star{background:none;border:none;padding:4px;cursor:pointer;color:var(--wafir-star-empty-color, #d1d5db);transition:transform .15s ease,color .15s ease;display:flex;align-items:center;justify-content:center}.star:hover:not(:disabled){transform:scale(1.15)}.star:focus-visible{outline:2px solid var(--wafir-primary-color, #2563eb);outline-offset:2px;border-radius:4px}.star svg{width:var(--wafir-star-size, 28px);height:var(--wafir-star-size, 28px);transition:fill .15s ease}.star.filled,.star.active{color:var(--wafir-star-color, #fbbf24)}.star:disabled{cursor:default;opacity:.8}.rating-text{margin-left:8px;font-size:14px;color:var(--wafir-text-secondary, #6b7280);font-weight:500}@keyframes star-pop{0%{transform:scale(1)}50%{transform:scale(1.3)}to{transform:scale(1)}}.star.active{animation:star-pop .3s ease}", ct = [
  { id: "feedback", label: "Feedback", icon: "thumbsup" },
  { id: "suggestion", label: "Suggestion", icon: "lightbulb" },
  { id: "issue", label: "Issue", icon: "bug" }
], Re = [
  "Very Unsatisfied",
  "Unsatisfied",
  "Neither satisfied or unsatisfied",
  "Satisfied",
  "Very Satisfied"
], ut = [
  {
    id: "rating",
    label: "How satisfied are you with our website?",
    type: "rating",
    required: !0,
    ratingLabels: Re
  },
  {
    id: "description",
    label: "What is the main reason for this rating?",
    type: "textarea",
    required: !1
  }
], dt = [
  {
    id: "title",
    label: "What is your suggestion?",
    type: "text",
    required: !0
  },
  {
    id: "description",
    label: "Additional information:",
    type: "textarea",
    required: !1
  }
], ft = [
  {
    id: "title",
    label: "What issue did you encounter?",
    type: "text",
    required: !0
  },
  {
    id: "description",
    label: "Additional information:",
    type: "textarea",
    required: !1
  }
];
function ht() {
  return {
    feedback: [...ut],
    suggestion: [...dt],
    issue: [...ft]
  };
}
var pt = Object.defineProperty, gt = Object.getOwnPropertyDescriptor, B = (e, t, r, o) => {
  for (var n = o > 1 ? void 0 : o ? gt(t, r) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (n = (o ? a(t, r, n) : a(n)) || n);
  return o && n && pt(t, r, n), n;
};
let z = class extends se {
  constructor() {
    super(...arguments), this.value = 0, this.max = 5, this.readonly = !1, this.labels = Re, this._hoverValue = 0;
  }
  _handleClick(e) {
    this.readonly || (this.value = e, this.dispatchEvent(
      new CustomEvent("rating-change", {
        detail: { value: e },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleMouseEnter(e) {
    this.readonly || (this._hoverValue = e);
  }
  _handleMouseLeave() {
    this._hoverValue = 0;
  }
  _handleKeyDown(e, t) {
    if (!this.readonly) {
      if (e.key === "Enter" || e.key === " ")
        e.preventDefault(), this._handleClick(t);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const r = Math.min(this.value + 1, this.max);
        this._handleClick(r);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const r = Math.max(this.value - 1, 1);
        this._handleClick(r);
      }
    }
  }
  _getLabelForRating(e) {
    return this.labels && this.labels[e - 1] ? this.labels[e - 1] : `${e} star${e !== 1 ? "s" : ""}`;
  }
  render() {
    const e = this._hoverValue || this.value, t = this._hoverValue > 0 ? this._getLabelForRating(this._hoverValue) : "";
    return m`
      <div
        class="star-rating ${this.readonly ? "readonly" : ""}"
        role="radiogroup"
        aria-label="Rating"
        @mouseleave="${this._handleMouseLeave}"
      >
        ${Array.from({ length: this.max }, (r, o) => {
      const n = o + 1, i = n <= e, a = n <= this.value;
      return m`
            <button
              type="button"
              class="star ${i ? "filled" : ""} ${a ? "active" : ""}"
              role="radio"
              aria-checked="${a}"
              aria-label="${this._getLabelForRating(n)}"
              tabindex="${n === 1 || n === this.value ? 0 : -1}"
              ?disabled="${this.readonly}"
              @click="${() => this._handleClick(n)}"
              @mouseenter="${() => this._handleMouseEnter(n)}"
              @keydown="${(s) => this._handleKeyDown(s, n)}"
            >
              <svg
                viewBox="0 0 24 24"
                fill="${i ? "currentColor" : "none"}"
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
        ${t ? m`<span class="rating-text hover-label">${t}</span>` : this.value > 0 ? m`<span class="rating-text"
                >${this._getLabelForRating(this.value)}</span
              >` : ""}
      </div>
    `;
  }
};
z.styles = [ie(lt)];
B([
  S({ type: Number })
], z.prototype, "value", 2);
B([
  S({ type: Number })
], z.prototype, "max", 2);
B([
  S({ type: Boolean })
], z.prototype, "readonly", 2);
B([
  S({ type: Array })
], z.prototype, "labels", 2);
B([
  E()
], z.prototype, "_hoverValue", 2);
z = B([
  ae("wafir-star-rating")
], z);
var fe = {}, W = {}, Se;
function mt() {
  if (Se) return W;
  Se = 1, Object.defineProperty(W, "__esModule", { value: !0 }), W.StoreController = void 0;
  let e = class {
    constructor(r, o) {
      this.host = r, this.atom = o, r.addController(this);
    }
    // Subscribe to the atom when the host connects
    hostConnected() {
      this.unsubscribe = this.atom.subscribe(() => {
        this.host.requestUpdate();
      });
    }
    // Unsubscribe from the atom when the host disconnects
    hostDisconnected() {
      var r;
      (r = this.unsubscribe) === null || r === void 0 || r.call(this);
    }
    /**
     * The current value of the atom.
     * @readonly
     */
    get value() {
      return this.atom.get();
    }
  };
  return W.StoreController = e, W;
}
var q = {}, ke;
function me() {
  if (ke) return q;
  ke = 1, Object.defineProperty(q, "__esModule", { value: !0 }), q.MultiStoreController = void 0;
  let e = class {
    constructor(r, o) {
      this.host = r, this.atoms = o, r.addController(this);
    }
    // Subscribe to the atom when the host connects
    hostConnected() {
      this.unsubscribes = this.atoms.map((r) => r.subscribe(() => this.host.requestUpdate()));
    }
    // Unsubscribe from the atom when the host disconnects
    hostDisconnected() {
      var r;
      (r = this.unsubscribes) === null || r === void 0 || r.forEach((o) => o());
    }
    /**
     * The current values of the atoms.
     * @readonly
     */
    get values() {
      return this.atoms.map((r) => r.get());
    }
  };
  return q.MultiStoreController = e, q;
}
var V = {}, _e;
function bt() {
  if (_e) return V;
  _e = 1, Object.defineProperty(V, "__esModule", { value: !0 }), V.useStores = void 0;
  const e = me();
  function t(...r) {
    return (o) => class extends o {
      constructor(...n) {
        super(...n), new e.MultiStoreController(this, r);
      }
    };
  }
  return V.useStores = t, V;
}
var H = {}, Ee;
function wt() {
  if (Ee) return H;
  Ee = 1, Object.defineProperty(H, "__esModule", { value: !0 }), H.withStores = void 0;
  const e = me(), t = (r, o) => class extends r {
    constructor(...i) {
      super(...i), new e.MultiStoreController(this, o);
    }
  };
  return H.withStores = t, H;
}
var $e;
function yt() {
  return $e || ($e = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.withStores = e.useStores = e.MultiStoreController = e.StoreController = void 0;
    var t = mt();
    Object.defineProperty(e, "StoreController", { enumerable: !0, get: function() {
      return t.StoreController;
    } });
    var r = me();
    Object.defineProperty(e, "MultiStoreController", { enumerable: !0, get: function() {
      return r.MultiStoreController;
    } });
    var o = bt();
    Object.defineProperty(e, "useStores", { enumerable: !0, get: function() {
      return o.useStores;
    } });
    var n = wt();
    Object.defineProperty(e, "withStores", { enumerable: !0, get: function() {
      return n.withStores;
    } });
  })(fe)), fe;
}
var I = yt();
let vt = Symbol("clean"), _ = [], M = 0;
const ee = 4, R = /* @__NO_SIDE_EFFECTS__ */ (e) => {
  let t = [], r = {
    get() {
      return r.lc || r.listen(() => {
      })(), r.value;
    },
    lc: 0,
    listen(o) {
      return r.lc = t.push(o), () => {
        for (let i = M + ee; i < _.length; )
          _[i] === o ? _.splice(i, ee) : i += ee;
        let n = t.indexOf(o);
        ~n && (t.splice(n, 1), --r.lc || r.off());
      };
    },
    notify(o, n) {
      let i = !_.length;
      for (let a of t)
        _.push(a, r.value, o, n);
      if (i) {
        for (M = 0; M < _.length; M += ee)
          _[M](
            _[M + 1],
            _[M + 2],
            _[M + 3]
          );
        _.length = 0;
      }
    },
    /* It will be called on last listener unsubscribing.
       We will redefine it in onMount and onStop. */
    off() {
    },
    set(o) {
      let n = r.value;
      n !== o && (r.value = o, r.notify(n));
    },
    subscribe(o) {
      let n = r.listen(o);
      return o(r.value), n;
    },
    value: e
  };
  return process.env.NODE_ENV !== "production" && (r[vt] = () => {
    t = [], r.lc = 0, r.off();
  }), r;
}, L = /* @__PURE__ */ R(!1), re = /* @__PURE__ */ R(!1), le = /* @__PURE__ */ R(null), P = /* @__PURE__ */ R(null), N = /* @__PURE__ */ R({}), X = /* @__PURE__ */ R(null), Y = /* @__PURE__ */ R([]), xt = () => {
  L.set(!0);
}, Te = () => {
  L.set(!1), P.set(null);
}, Pe = (e) => {
  le.set(e);
}, te = (e) => {
  N.set(e);
}, Ct = (e) => {
  X.set(e);
}, St = (e) => {
  Y.set(e);
}, Ie = () => {
  N.set({}), le.set(null), L.set(!1), re.set(!1), P.set(null), X.set(null), Y.set([]);
};
function kt(e, t) {
  return e[13] = 1, e[14] = t >> 8, e[15] = t & 255, e[16] = t >> 8, e[17] = t & 255, e;
}
const Oe = 112, Ue = 72, Be = 89, je = 115;
let he;
function _t() {
  const e = new Int32Array(256);
  for (let t = 0; t < 256; t++) {
    let r = t;
    for (let o = 0; o < 8; o++)
      r = r & 1 ? 3988292384 ^ r >>> 1 : r >>> 1;
    e[t] = r;
  }
  return e;
}
function Et(e) {
  let t = -1;
  he || (he = _t());
  for (let r = 0; r < e.length; r++)
    t = he[(t ^ e[r]) & 255] ^ t >>> 8;
  return t ^ -1;
}
function $t(e) {
  const t = e.length - 1;
  for (let r = t; r >= 4; r--)
    if (e[r - 4] === 9 && e[r - 3] === Oe && e[r - 2] === Ue && e[r - 1] === Be && e[r] === je)
      return r - 3;
  return 0;
}
function Tt(e, t, r = !1) {
  const o = new Uint8Array(13);
  t *= 39.3701, o[0] = Oe, o[1] = Ue, o[2] = Be, o[3] = je, o[4] = t >>> 24, o[5] = t >>> 16, o[6] = t >>> 8, o[7] = t & 255, o[8] = o[4], o[9] = o[5], o[10] = o[6], o[11] = o[7], o[12] = 1;
  const n = Et(o), i = new Uint8Array(4);
  if (i[0] = n >>> 24, i[1] = n >>> 16, i[2] = n >>> 8, i[3] = n & 255, r) {
    const a = $t(e);
    return e.set(o, a), e.set(i, a + 13), e;
  } else {
    const a = new Uint8Array(4);
    a[0] = 0, a[1] = 0, a[2] = 0, a[3] = 9;
    const s = new Uint8Array(54);
    return s.set(e, 0), s.set(a, 33), s.set(o, 37), s.set(i, 50), s;
  }
}
const It = "AAlwSFlz", At = "AAAJcEhZ", Mt = "AAAACXBI";
function Nt(e) {
  let t = e.indexOf(It);
  return t === -1 && (t = e.indexOf(At)), t === -1 && (t = e.indexOf(Mt)), t;
}
const We = "[modern-screenshot]", D = typeof window < "u", zt = D && "Worker" in window, Dt = D && "atob" in window, Ft = D && "btoa" in window, be = D ? window.navigator?.userAgent : "", qe = be.includes("Chrome"), oe = be.includes("AppleWebKit") && !qe, we = be.includes("Firefox"), Lt = (e) => e && "__CONTEXT__" in e, Rt = (e) => e.constructor.name === "CSSFontFaceRule", Pt = (e) => e.constructor.name === "CSSImportRule", $ = (e) => e.nodeType === 1, J = (e) => typeof e.className == "object", Ve = (e) => e.tagName === "image", Ot = (e) => e.tagName === "use", G = (e) => $(e) && typeof e.style < "u" && !J(e), Ut = (e) => e.nodeType === 8, Bt = (e) => e.nodeType === 3, U = (e) => e.tagName === "IMG", ce = (e) => e.tagName === "VIDEO", jt = (e) => e.tagName === "CANVAS", Wt = (e) => e.tagName === "TEXTAREA", qt = (e) => e.tagName === "INPUT", Vt = (e) => e.tagName === "STYLE", Ht = (e) => e.tagName === "SCRIPT", Xt = (e) => e.tagName === "SELECT", Yt = (e) => e.tagName === "SLOT", Gt = (e) => e.tagName === "IFRAME", Kt = (...e) => console.warn(We, ...e);
function Qt(e) {
  const t = e?.createElement?.("canvas");
  return t && (t.height = t.width = 1), !!t && "toDataURL" in t && !!t.toDataURL("image/webp").includes("image/webp");
}
const pe = (e) => e.startsWith("data:");
function He(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (D && e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i) || !D)
    return e;
  const r = ue().implementation.createHTMLDocument(), o = r.createElement("base"), n = r.createElement("a");
  return r.head.appendChild(o), r.body.appendChild(n), t && (o.href = t), n.href = e, n.href;
}
function ue(e) {
  return (e && $(e) ? e?.ownerDocument : e) ?? window.document;
}
const de = "http://www.w3.org/2000/svg";
function Jt(e, t, r) {
  const o = ue(r).createElementNS(de, "svg");
  return o.setAttributeNS(null, "width", e.toString()), o.setAttributeNS(null, "height", t.toString()), o.setAttributeNS(null, "viewBox", `0 0 ${e} ${t}`), o;
}
function Zt(e, t) {
  let r = new XMLSerializer().serializeToString(e);
  return t && (r = r.replace(/[\u0000-\u0008\v\f\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu, "")), `data:image/svg+xml;charset=utf-8,${encodeURIComponent(r)}`;
}
function er(e, t) {
  return new Promise((r, o) => {
    const n = new FileReader();
    n.onload = () => r(n.result), n.onerror = () => o(n.error), n.onabort = () => o(new Error(`Failed read blob to ${t}`)), n.readAsDataURL(e);
  });
}
const tr = (e) => er(e, "dataUrl");
function O(e, t) {
  const r = ue(t).createElement("img");
  return r.decoding = "sync", r.loading = "eager", r.src = e, r;
}
function K(e, t) {
  return new Promise((r) => {
    const { timeout: o, ownerDocument: n, onError: i, onWarn: a } = t ?? {}, s = typeof e == "string" ? O(e, ue(n)) : e;
    let c = null, d = null;
    function l() {
      r(s), c && clearTimeout(c), d?.();
    }
    if (o && (c = setTimeout(l, o)), ce(s)) {
      const u = s.currentSrc || s.src;
      if (!u)
        return s.poster ? K(s.poster, t).then(r) : l();
      if (s.readyState >= 2)
        return l();
      const f = l, p = (w) => {
        a?.(
          "Failed video load",
          u,
          w
        ), i?.(w), l();
      };
      d = () => {
        s.removeEventListener("loadeddata", f), s.removeEventListener("error", p);
      }, s.addEventListener("loadeddata", f, { once: !0 }), s.addEventListener("error", p, { once: !0 });
    } else {
      const u = Ve(s) ? s.href.baseVal : s.currentSrc || s.src;
      if (!u)
        return l();
      const f = async () => {
        if (U(s) && "decode" in s)
          try {
            await s.decode();
          } catch (w) {
            a?.(
              "Failed to decode image, trying to render anyway",
              s.dataset.originalSrc || u,
              w
            );
          }
        l();
      }, p = (w) => {
        a?.(
          "Failed image load",
          s.dataset.originalSrc || u,
          w
        ), l();
      };
      if (U(s) && s.complete)
        return f();
      d = () => {
        s.removeEventListener("load", f), s.removeEventListener("error", p);
      }, s.addEventListener("load", f, { once: !0 }), s.addEventListener("error", p, { once: !0 });
    }
  });
}
async function rr(e, t) {
  G(e) && (U(e) || ce(e) ? await K(e, t) : await Promise.all(
    ["img", "video"].flatMap((r) => Array.from(e.querySelectorAll(r)).map((o) => K(o, t)))
  ));
}
const Xe = /* @__PURE__ */ (function() {
  let t = 0;
  const r = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
  return () => (t += 1, `u${r()}${t}`);
})();
function Ye(e) {
  return e?.split(",").map((t) => t.trim().replace(/"|'/g, "").toLowerCase()).filter(Boolean);
}
let Ae = 0;
function or(e) {
  const t = `${We}[#${Ae}]`;
  return Ae++, {
    // eslint-disable-next-line no-console
    time: (r) => e && console.time(`${t} ${r}`),
    // eslint-disable-next-line no-console
    timeEnd: (r) => e && console.timeEnd(`${t} ${r}`),
    warn: (...r) => e && Kt(...r)
  };
}
function nr(e) {
  return {
    cache: e ? "no-cache" : "force-cache"
  };
}
async function ye(e, t) {
  return Lt(e) ? e : ir(e, { ...t, autoDestruct: !0 });
}
async function ir(e, t) {
  const { scale: r = 1, workerUrl: o, workerNumber: n = 1 } = t || {}, i = !!t?.debug, a = t?.features ?? !0, s = e.ownerDocument ?? (D ? window.document : void 0), c = e.ownerDocument?.defaultView ?? (D ? window : void 0), d = /* @__PURE__ */ new Map(), l = {
    // Options
    width: 0,
    height: 0,
    quality: 1,
    type: "image/png",
    scale: r,
    backgroundColor: null,
    style: null,
    filter: null,
    maximumCanvasSize: 0,
    timeout: 3e4,
    progress: null,
    debug: i,
    fetch: {
      requestInit: nr(t?.fetch?.bypassingCache),
      placeholderImage: "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      bypassingCache: !1,
      ...t?.fetch
    },
    fetchFn: null,
    font: {},
    drawImageInterval: 100,
    workerUrl: null,
    workerNumber: n,
    onCloneEachNode: null,
    onCloneNode: null,
    onEmbedNode: null,
    onCreateForeignObjectSvg: null,
    includeStyleProperties: null,
    autoDestruct: !1,
    ...t,
    // InternalContext
    __CONTEXT__: !0,
    log: or(i),
    node: e,
    ownerDocument: s,
    ownerWindow: c,
    dpi: r === 1 ? null : 96 * r,
    svgStyleElement: Ge(s),
    svgDefsElement: s?.createElementNS(de, "defs"),
    svgStyles: /* @__PURE__ */ new Map(),
    defaultComputedStyles: /* @__PURE__ */ new Map(),
    workers: [
      ...Array.from({
        length: zt && o && n ? n : 0
      })
    ].map(() => {
      try {
        const p = new Worker(o);
        return p.onmessage = async (w) => {
          const { url: h, result: b } = w.data;
          b ? d.get(h)?.resolve?.(b) : d.get(h)?.reject?.(new Error(`Error receiving message from worker: ${h}`));
        }, p.onmessageerror = (w) => {
          const { url: h } = w.data;
          d.get(h)?.reject?.(new Error(`Error receiving message from worker: ${h}`));
        }, p;
      } catch (p) {
        return l.log.warn("Failed to new Worker", p), null;
      }
    }).filter(Boolean),
    fontFamilies: /* @__PURE__ */ new Map(),
    fontCssTexts: /* @__PURE__ */ new Map(),
    acceptOfImage: `${[
      Qt(s) && "image/webp",
      "image/svg+xml",
      "image/*",
      "*/*"
    ].filter(Boolean).join(",")};q=0.8`,
    requests: d,
    drawImageCount: 0,
    tasks: [],
    features: a,
    isEnable: (p) => p === "restoreScrollPosition" ? typeof a == "boolean" ? !1 : a[p] ?? !1 : typeof a == "boolean" ? a : a[p] ?? !0,
    shadowRoots: []
  };
  l.log.time("wait until load"), await rr(e, { timeout: l.timeout, onWarn: l.log.warn }), l.log.timeEnd("wait until load");
  const { width: u, height: f } = sr(e, l);
  return l.width = u, l.height = f, l;
}
function Ge(e) {
  if (!e)
    return;
  const t = e.createElement("style"), r = t.ownerDocument.createTextNode(`
.______background-clip--text {
  background-clip: text;
  -webkit-background-clip: text;
}
`);
  return t.appendChild(r), t;
}
function sr(e, t) {
  let { width: r, height: o } = t;
  if ($(e) && (!r || !o)) {
    const n = e.getBoundingClientRect();
    r = r || n.width || Number(e.getAttribute("width")) || 0, o = o || n.height || Number(e.getAttribute("height")) || 0;
  }
  return { width: r, height: o };
}
async function ar(e, t) {
  const {
    log: r,
    timeout: o,
    drawImageCount: n,
    drawImageInterval: i
  } = t;
  r.time("image to canvas");
  const a = await K(e, { timeout: o, onWarn: t.log.warn }), { canvas: s, context2d: c } = lr(e.ownerDocument, t), d = () => {
    try {
      c?.drawImage(a, 0, 0, s.width, s.height);
    } catch (l) {
      t.log.warn("Failed to drawImage", l);
    }
  };
  if (d(), t.isEnable("fixSvgXmlDecode"))
    for (let l = 0; l < n; l++)
      await new Promise((u) => {
        setTimeout(() => {
          c?.clearRect(0, 0, s.width, s.height), d(), u();
        }, l + i);
      });
  return t.drawImageCount = 0, r.timeEnd("image to canvas"), s;
}
function lr(e, t) {
  const { width: r, height: o, scale: n, backgroundColor: i, maximumCanvasSize: a } = t, s = e.createElement("canvas");
  s.width = Math.floor(r * n), s.height = Math.floor(o * n), s.style.width = `${r}px`, s.style.height = `${o}px`, a && (s.width > a || s.height > a) && (s.width > a && s.height > a ? s.width > s.height ? (s.height *= a / s.width, s.width = a) : (s.width *= a / s.height, s.height = a) : s.width > a ? (s.height *= a / s.width, s.width = a) : (s.width *= a / s.height, s.height = a));
  const c = s.getContext("2d");
  return c && i && (c.fillStyle = i, c.fillRect(0, 0, s.width, s.height)), { canvas: s, context2d: c };
}
function Ke(e, t) {
  if (e.ownerDocument)
    try {
      const i = e.toDataURL();
      if (i !== "data:,")
        return O(i, e.ownerDocument);
    } catch (i) {
      t.log.warn("Failed to clone canvas", i);
    }
  const r = e.cloneNode(!1), o = e.getContext("2d"), n = r.getContext("2d");
  try {
    return o && n && n.putImageData(
      o.getImageData(0, 0, e.width, e.height),
      0,
      0
    ), r;
  } catch (i) {
    t.log.warn("Failed to clone canvas", i);
  }
  return r;
}
function cr(e, t) {
  try {
    if (e?.contentDocument?.body)
      return ve(e.contentDocument.body, t);
  } catch (r) {
    t.log.warn("Failed to clone iframe", r);
  }
  return e.cloneNode(!1);
}
function ur(e) {
  const t = e.cloneNode(!1);
  return e.currentSrc && e.currentSrc !== e.src && (t.src = e.currentSrc, t.srcset = ""), t.loading === "lazy" && (t.loading = "eager"), t;
}
async function dr(e, t) {
  if (e.ownerDocument && !e.currentSrc && e.poster)
    return O(e.poster, e.ownerDocument);
  const r = e.cloneNode(!1);
  r.crossOrigin = "anonymous", e.currentSrc && e.currentSrc !== e.src && (r.src = e.currentSrc);
  const o = r.ownerDocument;
  if (o) {
    let n = !0;
    if (await K(r, { onError: () => n = !1, onWarn: t.log.warn }), !n)
      return e.poster ? O(e.poster, e.ownerDocument) : r;
    r.currentTime = e.currentTime, await new Promise((a) => {
      r.addEventListener("seeked", a, { once: !0 });
    });
    const i = o.createElement("canvas");
    i.width = e.offsetWidth, i.height = e.offsetHeight;
    try {
      const a = i.getContext("2d");
      a && a.drawImage(r, 0, 0, i.width, i.height);
    } catch (a) {
      return t.log.warn("Failed to clone video", a), e.poster ? O(e.poster, e.ownerDocument) : r;
    }
    return Ke(i, t);
  }
  return r;
}
function fr(e, t) {
  return jt(e) ? Ke(e, t) : Gt(e) ? cr(e, t) : U(e) ? ur(e) : ce(e) ? dr(e, t) : e.cloneNode(!1);
}
function hr(e) {
  let t = e.sandbox;
  if (!t) {
    const { ownerDocument: r } = e;
    try {
      r && (t = r.createElement("iframe"), t.id = `__SANDBOX__${Xe()}`, t.width = "0", t.height = "0", t.style.visibility = "hidden", t.style.position = "fixed", r.body.appendChild(t), t.srcdoc = '<!DOCTYPE html><meta charset="UTF-8"><title></title><body>', e.sandbox = t);
    } catch (o) {
      e.log.warn("Failed to getSandBox", o);
    }
  }
  return t;
}
const pr = [
  "width",
  "height",
  "-webkit-text-fill-color"
], gr = [
  "stroke",
  "fill"
];
function Qe(e, t, r) {
  const { defaultComputedStyles: o } = r, n = e.nodeName.toLowerCase(), i = J(e) && n !== "svg", a = i ? gr.map((h) => [h, e.getAttribute(h)]).filter(([, h]) => h !== null) : [], s = [
    i && "svg",
    n,
    a.map((h, b) => `${h}=${b}`).join(","),
    t
  ].filter(Boolean).join(":");
  if (o.has(s))
    return o.get(s);
  const d = hr(r)?.contentWindow;
  if (!d)
    return /* @__PURE__ */ new Map();
  const l = d?.document;
  let u, f;
  i ? (u = l.createElementNS(de, "svg"), f = u.ownerDocument.createElementNS(u.namespaceURI, n), a.forEach(([h, b]) => {
    f.setAttributeNS(null, h, b);
  }), u.appendChild(f)) : u = f = l.createElement(n), f.textContent = " ", l.body.appendChild(u);
  const p = d.getComputedStyle(f, t), w = /* @__PURE__ */ new Map();
  for (let h = p.length, b = 0; b < h; b++) {
    const g = p.item(b);
    pr.includes(g) || w.set(g, p.getPropertyValue(g));
  }
  return l.body.removeChild(u), o.set(s, w), w;
}
function Je(e, t, r) {
  const o = /* @__PURE__ */ new Map(), n = [], i = /* @__PURE__ */ new Map();
  if (r)
    for (const s of r)
      a(s);
  else
    for (let s = e.length, c = 0; c < s; c++) {
      const d = e.item(c);
      a(d);
    }
  for (let s = n.length, c = 0; c < s; c++)
    i.get(n[c])?.forEach((d, l) => o.set(l, d));
  function a(s) {
    const c = e.getPropertyValue(s), d = e.getPropertyPriority(s), l = s.lastIndexOf("-"), u = l > -1 ? s.substring(0, l) : void 0;
    if (u) {
      let f = i.get(u);
      f || (f = /* @__PURE__ */ new Map(), i.set(u, f)), f.set(s, [c, d]);
    }
    t.get(s) === c && !d || (u ? n.push(u) : o.set(s, [c, d]));
  }
  return o;
}
function mr(e, t, r, o) {
  const { ownerWindow: n, includeStyleProperties: i, currentParentNodeStyle: a } = o, s = t.style, c = n.getComputedStyle(e), d = Qe(e, null, o);
  a?.forEach((u, f) => {
    d.delete(f);
  });
  const l = Je(c, d, i);
  l.delete("transition-property"), l.delete("all"), l.delete("d"), l.delete("content"), r && (l.delete("margin-top"), l.delete("margin-right"), l.delete("margin-bottom"), l.delete("margin-left"), l.delete("margin-block-start"), l.delete("margin-block-end"), l.delete("margin-inline-start"), l.delete("margin-inline-end"), l.set("box-sizing", ["border-box", ""])), l.get("background-clip")?.[0] === "text" && t.classList.add("______background-clip--text"), qe && (l.has("font-kerning") || l.set("font-kerning", ["normal", ""]), (l.get("overflow-x")?.[0] === "hidden" || l.get("overflow-y")?.[0] === "hidden") && l.get("text-overflow")?.[0] === "ellipsis" && e.scrollWidth === e.clientWidth && l.set("text-overflow", ["clip", ""]));
  for (let u = s.length, f = 0; f < u; f++)
    s.removeProperty(s.item(f));
  return l.forEach(([u, f], p) => {
    s.setProperty(p, u, f);
  }), l;
}
function br(e, t) {
  (Wt(e) || qt(e) || Xt(e)) && t.setAttribute("value", e.value);
}
const wr = [
  "::before",
  "::after"
  // '::placeholder', TODO
], yr = [
  "::-webkit-scrollbar",
  "::-webkit-scrollbar-button",
  // '::-webkit-scrollbar:horizontal', TODO
  "::-webkit-scrollbar-thumb",
  "::-webkit-scrollbar-track",
  "::-webkit-scrollbar-track-piece",
  // '::-webkit-scrollbar:vertical', TODO
  "::-webkit-scrollbar-corner",
  "::-webkit-resizer"
];
function vr(e, t, r, o, n) {
  const { ownerWindow: i, svgStyleElement: a, svgStyles: s, currentNodeStyle: c } = o;
  if (!a || !i)
    return;
  function d(l) {
    const u = i.getComputedStyle(e, l);
    let f = u.getPropertyValue("content");
    if (!f || f === "none")
      return;
    n?.(f), f = f.replace(/(')|(")|(counter\(.+\))/g, "");
    const p = [Xe()], w = Qe(e, l, o);
    c?.forEach((y, k) => {
      w.delete(k);
    });
    const h = Je(u, w, o.includeStyleProperties);
    h.delete("content"), h.delete("-webkit-locale"), h.get("background-clip")?.[0] === "text" && t.classList.add("______background-clip--text");
    const b = [
      `content: '${f}';`
    ];
    if (h.forEach(([y, k], A) => {
      b.push(`${A}: ${y}${k ? " !important" : ""};`);
    }), b.length === 1)
      return;
    try {
      t.className = [t.className, ...p].join(" ");
    } catch (y) {
      o.log.warn("Failed to copyPseudoClass", y);
      return;
    }
    const g = b.join(`
  `);
    let x = s.get(g);
    x || (x = [], s.set(g, x)), x.push(`.${p[0]}${l}`);
  }
  wr.forEach(d), r && yr.forEach(d);
}
const Me = /* @__PURE__ */ new Set([
  "symbol"
  // test/fixtures/svg.symbol.html
]);
async function Ne(e, t, r, o, n) {
  if ($(r) && (Vt(r) || Ht(r)) || o.filter && !o.filter(r))
    return;
  Me.has(t.nodeName) || Me.has(r.nodeName) ? o.currentParentNodeStyle = void 0 : o.currentParentNodeStyle = o.currentNodeStyle;
  const i = await ve(r, o, !1, n);
  o.isEnable("restoreScrollPosition") && xr(e, i), t.appendChild(i);
}
async function ze(e, t, r, o) {
  let n = e.firstChild;
  $(e) && e.shadowRoot && (n = e.shadowRoot?.firstChild, r.shadowRoots.push(e.shadowRoot));
  for (let i = n; i; i = i.nextSibling)
    if (!Ut(i))
      if ($(i) && Yt(i) && typeof i.assignedNodes == "function") {
        const a = i.assignedNodes();
        for (let s = 0; s < a.length; s++)
          await Ne(e, t, a[s], r, o);
      } else
        await Ne(e, t, i, r, o);
}
function xr(e, t) {
  if (!G(e) || !G(t))
    return;
  const { scrollTop: r, scrollLeft: o } = e;
  if (!r && !o)
    return;
  const { transform: n } = t.style, i = new DOMMatrix(n), { a, b: s, c, d } = i;
  i.a = 1, i.b = 0, i.c = 0, i.d = 1, i.translateSelf(-o, -r), i.a = a, i.b = s, i.c = c, i.d = d, t.style.transform = i.toString();
}
function Cr(e, t) {
  const { backgroundColor: r, width: o, height: n, style: i } = t, a = e.style;
  if (r && a.setProperty("background-color", r, "important"), o && a.setProperty("width", `${o}px`, "important"), n && a.setProperty("height", `${n}px`, "important"), i)
    for (const s in i) a[s] = i[s];
}
const Sr = /^[\w-:]+$/;
async function ve(e, t, r = !1, o) {
  const { ownerDocument: n, ownerWindow: i, fontFamilies: a, onCloneEachNode: s } = t;
  if (n && Bt(e))
    return o && /\S/.test(e.data) && o(e.data), n.createTextNode(e.data);
  if (n && i && $(e) && (G(e) || J(e))) {
    const d = await fr(e, t);
    if (t.isEnable("removeAbnormalAttributes")) {
      const h = d.getAttributeNames();
      for (let b = h.length, g = 0; g < b; g++) {
        const x = h[g];
        Sr.test(x) || d.removeAttribute(x);
      }
    }
    const l = t.currentNodeStyle = mr(e, d, r, t);
    r && Cr(d, t);
    let u = !1;
    if (t.isEnable("copyScrollbar")) {
      const h = [
        l.get("overflow-x")?.[0],
        l.get("overflow-y")?.[0]
      ];
      u = h.includes("scroll") || (h.includes("auto") || h.includes("overlay")) && (e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth);
    }
    const f = l.get("text-transform")?.[0], p = Ye(l.get("font-family")?.[0]), w = p ? (h) => {
      f === "uppercase" ? h = h.toUpperCase() : f === "lowercase" ? h = h.toLowerCase() : f === "capitalize" && (h = h[0].toUpperCase() + h.substring(1)), p.forEach((b) => {
        let g = a.get(b);
        g || a.set(b, g = /* @__PURE__ */ new Set()), h.split("").forEach((x) => g.add(x));
      });
    } : void 0;
    return vr(
      e,
      d,
      u,
      t,
      w
    ), br(e, d), ce(e) || await ze(
      e,
      d,
      t,
      w
    ), await s?.(d), d;
  }
  const c = e.cloneNode(!1);
  return await ze(e, c, t), await s?.(c), c;
}
function kr(e) {
  if (e.ownerDocument = void 0, e.ownerWindow = void 0, e.svgStyleElement = void 0, e.svgDefsElement = void 0, e.svgStyles.clear(), e.defaultComputedStyles.clear(), e.sandbox) {
    try {
      e.sandbox.remove();
    } catch (t) {
      e.log.warn("Failed to destroyContext", t);
    }
    e.sandbox = void 0;
  }
  e.workers = [], e.fontFamilies.clear(), e.fontCssTexts.clear(), e.requests.clear(), e.tasks = [], e.shadowRoots = [];
}
function _r(e) {
  const { url: t, timeout: r, responseType: o, ...n } = e, i = new AbortController(), a = r ? setTimeout(() => i.abort(), r) : void 0;
  return fetch(t, { signal: i.signal, ...n }).then((s) => {
    if (!s.ok)
      throw new Error("Failed fetch, not 2xx response", { cause: s });
    switch (o) {
      case "arrayBuffer":
        return s.arrayBuffer();
      case "dataUrl":
        return s.blob().then(tr);
      case "text":
      default:
        return s.text();
    }
  }).finally(() => clearTimeout(a));
}
function Q(e, t) {
  const { url: r, requestType: o = "text", responseType: n = "text", imageDom: i } = t;
  let a = r;
  const {
    timeout: s,
    acceptOfImage: c,
    requests: d,
    fetchFn: l,
    fetch: {
      requestInit: u,
      bypassingCache: f,
      placeholderImage: p
    },
    font: w,
    workers: h,
    fontFamilies: b
  } = e;
  o === "image" && (oe || we) && e.drawImageCount++;
  let g = d.get(r);
  if (!g) {
    f && f instanceof RegExp && f.test(a) && (a += (/\?/.test(a) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
    const x = o.startsWith("font") && w && w.minify, y = /* @__PURE__ */ new Set();
    x && o.split(";")[1].split(",").forEach((Z) => {
      b.has(Z) && b.get(Z).forEach((xe) => y.add(xe));
    });
    const k = x && y.size, A = {
      url: a,
      timeout: s,
      responseType: k ? "arrayBuffer" : n,
      headers: o === "image" ? { accept: c } : void 0,
      ...u
    };
    g = {
      type: o,
      resolve: void 0,
      reject: void 0,
      response: null
    }, g.response = (async () => {
      if (l && o === "image") {
        const T = await l(r);
        if (T)
          return T;
      }
      return !oe && r.startsWith("http") && h.length ? new Promise((T, Z) => {
        h[d.size & h.length - 1].postMessage({ rawUrl: r, ...A }), g.resolve = T, g.reject = Z;
      }) : _r(A);
    })().catch((T) => {
      if (d.delete(r), o === "image" && p)
        return e.log.warn("Failed to fetch image base64, trying to use placeholder image", a), typeof p == "string" ? p : p(i);
      throw T;
    }), d.set(r, g);
  }
  return g.response;
}
async function Ze(e, t, r, o) {
  if (!et(e))
    return e;
  for (const [n, i] of Er(e, t))
    try {
      const a = await Q(
        r,
        {
          url: i,
          requestType: o ? "image" : "text",
          responseType: "dataUrl"
        }
      );
      e = e.replace($r(n), `$1${a}$3`);
    } catch (a) {
      r.log.warn("Failed to fetch css data url", n, a);
    }
  return e;
}
function et(e) {
  return /url\((['"]?)([^'"]+?)\1\)/.test(e);
}
const tt = /url\((['"]?)([^'"]+?)\1\)/g;
function Er(e, t) {
  const r = [];
  return e.replace(tt, (o, n, i) => (r.push([i, He(i, t)]), o)), r.filter(([o]) => !pe(o));
}
function $r(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
const Tr = [
  "background-image",
  "border-image-source",
  "-webkit-border-image",
  "-webkit-mask-image",
  "list-style-image"
];
function Ir(e, t) {
  return Tr.map((r) => {
    const o = e.getPropertyValue(r);
    return !o || o === "none" ? null : ((oe || we) && t.drawImageCount++, Ze(o, null, t, !0).then((n) => {
      !n || o === n || e.setProperty(
        r,
        n,
        e.getPropertyPriority(r)
      );
    }));
  }).filter(Boolean);
}
function Ar(e, t) {
  if (U(e)) {
    const r = e.currentSrc || e.src;
    if (!pe(r))
      return [
        Q(t, {
          url: r,
          imageDom: e,
          requestType: "image",
          responseType: "dataUrl"
        }).then((o) => {
          o && (e.srcset = "", e.dataset.originalSrc = r, e.src = o || "");
        })
      ];
    (oe || we) && t.drawImageCount++;
  } else if (J(e) && !pe(e.href.baseVal)) {
    const r = e.href.baseVal;
    return [
      Q(t, {
        url: r,
        imageDom: e,
        requestType: "image",
        responseType: "dataUrl"
      }).then((o) => {
        o && (e.dataset.originalSrc = r, e.href.baseVal = o || "");
      })
    ];
  }
  return [];
}
function Mr(e, t) {
  const { ownerDocument: r, svgDefsElement: o } = t, n = e.getAttribute("href") ?? e.getAttribute("xlink:href");
  if (!n)
    return [];
  const [i, a] = n.split("#");
  if (a) {
    const s = `#${a}`, c = t.shadowRoots.reduce(
      (d, l) => d ?? l.querySelector(`svg ${s}`),
      r?.querySelector(`svg ${s}`)
    );
    if (i && e.setAttribute("href", s), o?.querySelector(s))
      return [];
    if (c)
      return o?.appendChild(c.cloneNode(!0)), [];
    if (i)
      return [
        Q(t, {
          url: i,
          responseType: "text"
        }).then((d) => {
          o?.insertAdjacentHTML("beforeend", d);
        })
      ];
  }
  return [];
}
function rt(e, t) {
  const { tasks: r } = t;
  $(e) && ((U(e) || Ve(e)) && r.push(...Ar(e, t)), Ot(e) && r.push(...Mr(e, t))), G(e) && r.push(...Ir(e.style, t)), e.childNodes.forEach((o) => {
    rt(o, t);
  });
}
async function Nr(e, t) {
  const {
    ownerDocument: r,
    svgStyleElement: o,
    fontFamilies: n,
    fontCssTexts: i,
    tasks: a,
    font: s
  } = t;
  if (!(!r || !o || !n.size))
    if (s && s.cssText) {
      const c = Fe(s.cssText, t);
      o.appendChild(r.createTextNode(`${c}
`));
    } else {
      const c = Array.from(r.styleSheets).filter((l) => {
        try {
          return "cssRules" in l && !!l.cssRules.length;
        } catch (u) {
          return t.log.warn(`Error while reading CSS rules from ${l.href}`, u), !1;
        }
      });
      await Promise.all(
        c.flatMap((l) => Array.from(l.cssRules).map(async (u, f) => {
          if (Pt(u)) {
            let p = f + 1;
            const w = u.href;
            let h = "";
            try {
              h = await Q(t, {
                url: w,
                requestType: "text",
                responseType: "text"
              });
            } catch (g) {
              t.log.warn(`Error fetch remote css import from ${w}`, g);
            }
            const b = h.replace(
              tt,
              (g, x, y) => g.replace(y, He(y, w))
            );
            for (const g of Dr(b))
              try {
                l.insertRule(
                  g,
                  g.startsWith("@import") ? p += 1 : l.cssRules.length
                );
              } catch (x) {
                t.log.warn("Error inserting rule from remote css import", { rule: g, error: x });
              }
          }
        }))
      ), c.flatMap((l) => Array.from(l.cssRules)).filter((l) => Rt(l) && et(l.style.getPropertyValue("src")) && Ye(l.style.getPropertyValue("font-family"))?.some((u) => n.has(u))).forEach((l) => {
        const u = l, f = i.get(u.cssText);
        f ? o.appendChild(r.createTextNode(`${f}
`)) : a.push(
          Ze(
            u.cssText,
            u.parentStyleSheet ? u.parentStyleSheet.href : null,
            t
          ).then((p) => {
            p = Fe(p, t), i.set(u.cssText, p), o.appendChild(r.createTextNode(`${p}
`));
          })
        );
      });
    }
}
const zr = /(\/\*[\s\S]*?\*\/)/g, De = /((@.*?keyframes [\s\S]*?){([\s\S]*?}\s*?)})/gi;
function Dr(e) {
  if (e == null)
    return [];
  const t = [];
  let r = e.replace(zr, "");
  for (; ; ) {
    const i = De.exec(r);
    if (!i)
      break;
    t.push(i[0]);
  }
  r = r.replace(De, "");
  const o = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, n = new RegExp(
    // eslint-disable-next-line
    "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",
    "gi"
  );
  for (; ; ) {
    let i = o.exec(r);
    if (i)
      n.lastIndex = o.lastIndex;
    else if (i = n.exec(r), i)
      o.lastIndex = n.lastIndex;
    else
      break;
    t.push(i[0]);
  }
  return t;
}
const Fr = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, Lr = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function Fe(e, t) {
  const { font: r } = t, o = r ? r?.preferredFormat : void 0;
  return o ? e.replace(Lr, (n) => {
    for (; ; ) {
      const [i, , a] = Fr.exec(n) || [];
      if (!a)
        return "";
      if (a === o)
        return `src: ${i};`;
    }
  }) : e;
}
async function Rr(e, t) {
  const r = await ye(e, t);
  if ($(r.node) && J(r.node))
    return r.node;
  const {
    ownerDocument: o,
    log: n,
    tasks: i,
    svgStyleElement: a,
    svgDefsElement: s,
    svgStyles: c,
    font: d,
    progress: l,
    autoDestruct: u,
    onCloneNode: f,
    onEmbedNode: p,
    onCreateForeignObjectSvg: w
  } = r;
  n.time("clone node");
  const h = await ve(r.node, r, !0);
  if (a && o) {
    let k = "";
    c.forEach((A, T) => {
      k += `${A.join(`,
`)} {
  ${T}
}
`;
    }), a.appendChild(o.createTextNode(k));
  }
  n.timeEnd("clone node"), await f?.(h), d !== !1 && $(h) && (n.time("embed web font"), await Nr(h, r), n.timeEnd("embed web font")), n.time("embed node"), rt(h, r);
  const b = i.length;
  let g = 0;
  const x = async () => {
    for (; ; ) {
      const k = i.pop();
      if (!k)
        break;
      try {
        await k;
      } catch (A) {
        r.log.warn("Failed to run task", A);
      }
      l?.(++g, b);
    }
  };
  l?.(g, b), await Promise.all([...Array.from({ length: 4 })].map(x)), n.timeEnd("embed node"), await p?.(h);
  const y = Pr(h, r);
  return s && y.insertBefore(s, y.children[0]), a && y.insertBefore(a, y.children[0]), u && kr(r), await w?.(y), y;
}
function Pr(e, t) {
  const { width: r, height: o } = t, n = Jt(r, o, e.ownerDocument), i = n.ownerDocument.createElementNS(n.namespaceURI, "foreignObject");
  return i.setAttributeNS(null, "x", "0%"), i.setAttributeNS(null, "y", "0%"), i.setAttributeNS(null, "width", "100%"), i.setAttributeNS(null, "height", "100%"), i.append(e), n.appendChild(i), n;
}
async function Or(e, t) {
  const r = await ye(e, t), o = await Rr(r), n = Zt(o, r.isEnable("removeControlCharacter"));
  r.autoDestruct || (r.svgStyleElement = Ge(r.ownerDocument), r.svgDefsElement = r.ownerDocument?.createElementNS(de, "defs"), r.svgStyles.clear());
  const i = O(n, o.ownerDocument);
  return await ar(i, r);
}
async function Ur(e, t) {
  const r = await ye(e, t), { log: o, quality: n, type: i, dpi: a } = r, s = await Or(r);
  o.time("canvas to data url");
  let c = s.toDataURL(i, n);
  if (["image/png", "image/jpeg"].includes(i) && a && Dt && Ft) {
    const [d, l] = c.split(",");
    let u = 0, f = !1;
    if (i === "image/png") {
      const y = Nt(l);
      y >= 0 ? (u = Math.ceil((y + 28) / 3) * 4, f = !0) : u = 33 / 3 * 4;
    } else i === "image/jpeg" && (u = 18 / 3 * 4);
    const p = l.substring(0, u), w = l.substring(u), h = window.atob(p), b = new Uint8Array(h.length);
    for (let y = 0; y < b.length; y++)
      b[y] = h.charCodeAt(y);
    const g = i === "image/png" ? Tt(b, a, f) : kt(b, a), x = window.btoa(String.fromCharCode(...g));
    c = [d, ",", x, w].join("");
  }
  return o.timeEnd("canvas to data url"), c;
}
async function ge(e = null) {
  re.set(!0), await new Promise((r) => setTimeout(r, 50));
  let t = null;
  try {
    if (e) {
      const c = e.getBoundingClientRect(), d = window.scrollX, l = window.scrollY;
      t = document.createElement("div"), t.className = "wafir-temp-highlight", Object.assign(t.style, {
        position: "absolute",
        top: `${c.top + l}px`,
        left: `${c.left + d}px`,
        width: `${c.width}px`,
        height: `${c.height}px`,
        border: "4px solid #2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        zIndex: "2147483647",
        boxSizing: "border-box",
        pointerEvents: "none"
      }), document.body.appendChild(t);
    }
    const r = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      window.innerWidth
    ), o = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    ), i = window.getComputedStyle(document.body).backgroundColor, a = i === "rgba(0, 0, 0, 0)" || i === "transparent" ? "#ffffff" : i, s = await Ur(document.documentElement, {
      width: r,
      height: o,
      backgroundColor: a,
      filter: (c) => c instanceof HTMLElement && c.tagName.toLowerCase().startsWith("wafir-") ? c.className === "wafir-temp-highlight" : !0
    });
    Pe(s);
  } catch (r) {
    console.error("Failed to capture full page screenshot", r);
  } finally {
    t && t.parentElement && document.body.removeChild(t), re.set(!1);
  }
}
var Br = Object.defineProperty, jr = Object.getOwnPropertyDescriptor, j = (e, t, r, o) => {
  for (var n = o > 1 ? void 0 : o ? jr(t, r) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (n = (o ? a(t, r, n) : a(n)) || n);
  return o && n && Br(t, r, n), n;
};
let F = class extends se {
  constructor() {
    super(...arguments), this.fields = [], this.showBrowserInfo = !1, this.showConsoleLog = !1, this.loading = !1, this.bridgeAvailable = !0, this._capturedImageController = new I.StoreController(this, le), this._formDataController = new I.StoreController(this, N), this._browserInfoController = new I.StoreController(this, X), this._consoleLogsController = new I.StoreController(this, Y);
  }
  willUpdate(e) {
    if (e.has("fields")) {
      const t = N.get();
      let r = !1;
      const o = { ...t };
      this.fields.forEach((n) => {
        n.defaultValue && !o[n.id] && (o[n.id] = n.defaultValue, r = !0);
      }), r && te(o);
    }
  }
  _handleInputChange(e, t) {
    const r = e.target, o = r.type === "checkbox" ? r.checked : r.value;
    te({ ...N.get(), [t]: o });
  }
  _handleSubmit(e) {
    e.preventDefault(), this.loading = !0, this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { formData: N.get() },
        bubbles: !0,
        composed: !0
      })
    );
  }
  // Helper to render specific input types
  _renderFieldInput(e) {
    const t = this._formDataController.value[e.id] || "";
    switch (e.type) {
      case "textarea":
        return m`
          <textarea
            id="${e.id}"
            .value="${t}"
            placeholder="${e.placeholder || ""}"
            ?required="${e.required}"
            @input="${(o) => this._handleInputChange(o, e.id)}"
          ></textarea>
        `;
      case "select":
        return m`
          <select
            id="${e.id}"
            .value="${t}"
            ?required="${e.required}"
            @change="${(o) => this._handleInputChange(o, e.id)}"
          >
            <option value="" disabled selected>Select an option</option>
            ${e.options?.map(
          (o) => m`<option value="${o}">${o}</option>`
        )}
          </select>
        `;
      case "switch":
        const r = t || e.options?.[0] || "";
        return m`
          <div class="switch-container">
            ${e.options?.map(
          (o) => m`
                <button
                  type="button"
                  class="switch-option ${r === o ? "active" : ""}"
                  @click="${() => {
            te({ ...N.get(), [e.id]: o });
          }}"
                >
                  ${o}
                </button>
              `
        )}
          </div>
        `;
      case "checkbox":
        return m`
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="${e.id}"
              .checked="${!!t}"
              @change="${(o) => this._handleInputChange(o, e.id)}"
            />
            <label for="${e.id}">${e.label}</label>
          </div>
        `;
      case "screenshot":
        return m`
          <div>
            ${this._capturedImageController.value ? m`
                  <div class="screenshot-preview">
                    <img
                      src="${this._capturedImageController.value}"
                      alt="Captured screenshot"
                    />
                    <button
                      type="button"
                      class="screenshot-clear"
                      @click="${() => Pe(null)}"
                    >
                      &times;
                    </button>
                  </div>
                  <div class="screenshot-actions">
                    <button
                      type="button"
                      @click="${() => ge()}"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      class="highlight-btn"
                      @click="${() => xt()}"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Highlight
                    </button>
                  </div>
                ` : m`
                  <button
                    type="button"
                    class="capture-button"
                    @click="${() => ge()}"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Take Screenshot
                  </button>
                `}
          </div>
        `;
      case "rating":
        return m`
          <wafir-star-rating
            .value="${Number(t) || 0}"
            .labels="${e.ratingLabels || []}"
            @rating-change="${(o) => {
          te({ ...N.get(), [e.id]: o.detail.value });
        }}"
          ></wafir-star-rating>
        `;
      case "text":
      case "email":
      default:
        return m`
          <input
            type="${e.type}"
            id="${e.id}"
            .value="${t}"
            placeholder="${e.placeholder || ""}"
            ?required="${e.required}"
            ?hidden="${e.hidden}"
            @input="${(o) => this._handleInputChange(o, e.id)}"
          />
        `;
    }
  }
  render() {
    return m`
      <form @submit="${this._handleSubmit}">
        ${this.fields.map((e) => e.hidden ? this._renderFieldInput(e) : e.type === "checkbox" ? m`<div class="form-group">
              ${this._renderFieldInput(e)}
            </div>` : m`
            <div class="form-group">
              <label for="${e.id}">
                ${e.label} ${e.required ? "*" : ""}
              </label>
              ${this._renderFieldInput(e)}
            </div>
          `)}

        <button class="submit-button" type="submit" ?disabled="${this.loading || !this.bridgeAvailable}">
          ${this.loading ? m`<span class="spinner"></span> Submitting...` : this.bridgeAvailable ? "Submit" : "Service Unavailable"}
        </button>

        ${this.showBrowserInfo && this._browserInfoController.value ? m`
              <div class="telemetry-section">
                <h4>Browser Information</h4>
                <div class="telemetry-grid">
                  <span class="telemetry-label">URL:</span>
                  <span>${this._browserInfoController.value.url}</span>
                  <span class="telemetry-label">Viewport:</span>
                  <span
                    >${this._browserInfoController.value.viewportWidth}x${this._browserInfoController.value.viewportHeight}</span
                  >
                  <span class="telemetry-label">UA:</span>
                  <span style="font-size: 10px;"
                    >${this._browserInfoController.value.userAgent}</span
                  >
                </div>
              </div>
            ` : ""}
        ${this.showConsoleLog && this._consoleLogsController.value.length > 0 ? m`
              <div class="telemetry-section">
                <h4>Recent Console Logs</h4>
                <div class="logs-container">
                  ${this._consoleLogsController.value.map(
      (e) => m`
                      <div
                        class="log-item ${e.type === "warn" ? "log-warn" : "log-error"}"
                      >
                        [${e.timestamp.split("T")[1].split(".")[0]}]
                        ${e.message}
                      </div>
                    `
    )}
                </div>
              </div>
            ` : ""}
      </form>
    `;
  }
};
F.styles = [ie(at)];
j([
  S({ type: Array })
], F.prototype, "fields", 2);
j([
  S({ type: Boolean })
], F.prototype, "showBrowserInfo", 2);
j([
  S({ type: Boolean })
], F.prototype, "showConsoleLog", 2);
j([
  S({ type: Boolean })
], F.prototype, "loading", 2);
j([
  S({ type: Boolean })
], F.prototype, "bridgeAvailable", 2);
F = j([
  ae("wafir-form")
], F);
const Wr = "html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button}button::-moz-focus-inner,[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}:host{position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:10000}.overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:var(--wafir-highlighter-overlay-bg, rgba(0, 0, 0, .1));pointer-events:auto;cursor:crosshair}.highlight{position:absolute;border:2px solid var(--wafir-highlighter-primary-color, #2563eb);background:var(--wafir-highlighter-highlight-bg, rgba(37, 99, 235, .1));pointer-events:none;transition:all .1s ease;box-sizing:border-box;z-index:10001}.label{position:absolute;top:-24px;left:0;background:var(--wafir-highlighter-primary-color, #2563eb);color:#fff;padding:2px 6px;font-size:10px;border-radius:4px;white-space:nowrap}";
var qr = Object.defineProperty, Vr = Object.getOwnPropertyDescriptor, ot = (e, t, r, o) => {
  for (var n = o > 1 ? void 0 : o ? Vr(t, r) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (n = (o ? a(t, r, n) : a(n)) || n);
  return o && n && qr(t, r, n), n;
};
let ne = class extends se {
  constructor() {
    super(...arguments), this._isSelectingController = new I.StoreController(this, L), this._hoveredElementController = new I.StoreController(this, P), this._rect = null, this._handleKeyDown = (e) => {
      e.key === "Escape" && L.get() && Te();
    }, this._handleMouseMove = (e) => {
      if (!L.get()) return;
      const t = this.shadowRoot?.querySelector(".overlay");
      t && (t.style.pointerEvents = "none");
      const r = document.elementFromPoint(e.clientX, e.clientY);
      t && (t.style.pointerEvents = "auto"), r && !this._isWafirElement(r) ? (P.set(r), this._rect = r.getBoundingClientRect()) : (P.set(null), this._rect = null);
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("keydown", this._handleKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("keydown", this._handleKeyDown);
  }
  _isWafirElement(e) {
    let t = e;
    for (; t; ) {
      if (t.tagName.toLowerCase().startsWith("wafir-")) return !0;
      if (t.parentElement)
        t = t.parentElement;
      else if (t.getRootNode().host)
        t = t.getRootNode().host;
      else
        break;
    }
    return !1;
  }
  async _handleClick() {
    const e = P.get();
    e && (await ge(e), Te());
  }
  render() {
    return this._isSelectingController.value ? m`
      <div
        class="overlay"
        @mousemove="${this._handleMouseMove}"
        @click="${this._handleClick}"
      ></div>
      ${this._rect ? m`
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
          ` : ""}
    ` : m``;
  }
};
ne.styles = [ie(Wr)];
ot([
  E()
], ne.prototype, "_rect", 2);
ne = ot([
  ae("wafir-highlighter")
], ne);
function Hr(e) {
  const t = e.split(","), r = t[0].match(/:(.*?);/), o = r ? r[1] : "image/png", n = atob(t[1]);
  let i = n.length;
  const a = new Uint8Array(i);
  for (; i--; )
    a[i] = n.charCodeAt(i);
  return new Blob([a], { type: o });
}
function Xr() {
  return {
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
    url: window.location.href
  };
}
class Yr {
  constructor() {
    this.logs = [], this.maxLogs = 50, this.originalWarn = console.warn, this.originalError = console.error, this.setupInterceptor();
  }
  setupInterceptor() {
    console.warn = (...t) => {
      this.addLog("warn", t), this.originalWarn.apply(console, t);
    }, console.error = (...t) => {
      this.addLog("error", t), this.originalError.apply(console, t);
    };
  }
  addLog(t, r) {
    const o = r.map(
      (n) => typeof n == "object" ? JSON.stringify(n) : String(n)
    ).join(" ").trim();
    this.logs.push({
      type: t,
      message: o,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), this.logs.length > this.maxLogs && this.logs.shift();
  }
  getLogs() {
    return [...this.logs];
  }
  clear() {
    this.logs = [];
  }
}
const Gr = new Yr();
var Kr = Object.defineProperty, Qr = Object.getOwnPropertyDescriptor, C = (e, t, r, o) => {
  for (var n = o > 1 ? void 0 : o ? Qr(t, r) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (n = (o ? a(t, r, n) : a(n)) || n);
  return o && n && Kr(t, r, n), n;
};
const Jr = {
  thumbsup: Le,
  lightbulb: st,
  bug: it
};
let v = class extends se {
  constructor() {
    super(...arguments), this.buttonText = "", this.modalTitle = "Contact Us", this.position = "bottom-right", this.tooltipText = "Open Issue Reporter", this.config = {}, this._isSelectingController = new I.StoreController(this, L), this._isCapturingController = new I.StoreController(this, re), this._capturedImageController = new I.StoreController(this, le), this.isModalOpen = !1, this.isConfigLoading = !1, this.configFetchError = null, this.isBridgeAvailable = !0, this._hasCustomTrigger = !1, this._remoteConfig = null, this._tabConfigs = ht(), this._activeTab = "feedback", this._availableTabs = ct, this.installationId = 0, this.owner = "", this.repo = "", this.bridgeUrl = "";
  }
  connectedCallback() {
    super.connectedCallback(), this._checkCustomTrigger(), this._mergeInlineConfig();
  }
  _checkCustomTrigger() {
    this._hasCustomTrigger = this.querySelector('[slot="trigger"]') !== null;
  }
  _mergeInlineConfig() {
    if (this.config && Object.keys(this.config).length > 0) {
      const e = { ...this._tabConfigs };
      for (const t of Object.keys(this.config))
        this.config[t] && (e[t] = this.config[t]);
      this._tabConfigs = e;
    }
  }
  openModal() {
    this.isModalOpen || this._openModal();
  }
  async _openModal() {
    this.isModalOpen = !0, Ct(Xr()), St(Gr.getLogs()), await this._checkBridgeHealth(), await this._fetchConfig();
  }
  async _handleTriggerClick() {
    this.isModalOpen ? this._closeModal() : await this._openModal();
  }
  async _checkBridgeHealth() {
    try {
      const { checkBridgeHealth: e } = await import("./client-D8x1_mCC.js");
      this.isBridgeAvailable = await e(
        this.bridgeUrl || void 0
      ), this.isBridgeAvailable || console.warn("Wafir: Bridge service is not available");
    } catch (e) {
      console.warn("Wafir: Failed to check bridge health", e), this.isBridgeAvailable = !1;
    }
  }
  async _fetchConfig() {
    if (!(!this.installationId || !this.owner || !this.repo)) {
      this.isConfigLoading = !0, this.configFetchError = null;
      try {
        const { getWafirConfig: e } = await import("./client-D8x1_mCC.js"), t = await e(
          this.installationId,
          this.owner,
          this.repo,
          this.bridgeUrl || void 0
        );
        if (t) {
          if (this._remoteConfig = t, t.fields) {
            const r = t.fields.map(
              (o) => ({
                id: o.name,
                label: o.label,
                type: o.type,
                required: o.required,
                options: o.options
              })
            );
            t.issueTypes && t.issueTypes.length > 0 && r.unshift({
              id: "issueType",
              label: "Issue Type",
              type: "select",
              required: !0,
              options: t.issueTypes.map((o) => o.name)
            }), t.issue && t.issue.screenshot && r.push({
              id: "screenshot",
              label: "Screenshot",
              type: "screenshot"
            }), this._tabConfigs = {
              ...this._tabConfigs,
              issue: r
            };
          }
          t.feedback && t.feedback.title && (this.modalTitle = t.feedback.title);
        }
      } catch (e) {
        console.warn(
          "Wafir: Failed to fetch remote config, using defaults",
          e
        );
      } finally {
        this.isConfigLoading = !1;
      }
    }
  }
  _closeModal() {
    this.isModalOpen = !1, Ie();
  }
  _getActiveFormConfig() {
    return this._tabConfigs[this._activeTab] || [];
  }
  _switchTab(e) {
    this._activeTab = e;
  }
  updated(e) {
    e.has("_isSelectingController");
  }
  async _handleSubmit(e) {
    const t = e.detail.formData;
    if (!this.installationId || !this.owner || !this.repo) {
      console.error(
        "Wafir: Missing configuration (installationId, owner, or repo)"
      ), alert("Widget configuration error");
      return;
    }
    try {
      let r, o;
      const n = [this._activeTab];
      if (this._activeTab === "feedback") {
        const l = Number(t.rating) || 0;
        this._tabConfigs.feedback.some(
          (f) => f.id === "rating"
        ) && l > 0 ? r = t.title || "Feedback" : r = `Feedback rating: ${l}`, o = t.description || "";
      } else if (this._activeTab === "suggestion")
        r = t.title || "Suggestion", o = t.description || "";
      else {
        r = t.title || "No Title", o = t.description || "";
        const l = t.type;
        l && n.push(l.toLowerCase());
      }
      const { submitIssue: i } = await import("./client-D8x1_mCC.js"), a = this._capturedImageController.value, s = a ? Hr(a) : void 0;
      if (this._activeTab === "issue" && this._remoteConfig?.issue?.browserInfo && X.get()) {
        const l = X.get();
        o += `

# Browser Info
| Field | Value |
| :--- | :--- |
| URL | ${l.url} |
| User Agent | \`${l.userAgent}\` |
| Viewport | ${l.viewportWidth}x${l.viewportHeight} |
| Language | ${l.language} |`;
      }
      if (this._activeTab === "issue" && this._remoteConfig?.issue?.consoleLog && Y.get().length > 0) {
        const l = Y.get();
        o += `

# Console Logs
\`\`\`
${l.map((u) => `[${u.type.toUpperCase()}] ${u.message}`).join(`
`)}
\`\`\``;
      }
      this._activeTab === "issue" && this._remoteConfig?.issue?.screenshot && s && (o += `

# Screenshot`);
      const c = this._activeTab === "feedback" ? "feedback" : "issue", d = this._activeTab === "feedback" && Number(t.rating) || void 0;
      await i(
        this.installationId,
        this.owner,
        this.repo,
        r,
        o,
        n,
        s,
        this.bridgeUrl || void 0,
        d,
        c
      ), alert("Thank you for your input!"), Ie(), this.isModalOpen = !1;
    } catch (r) {
      console.error("Wafir: Submit failed", r), alert("Failed to submit. Please check configuration.");
    }
  }
  _renderTabIcon(e) {
    return Ce(Jr[e] || "");
  }
  render() {
    return this._isCapturingController.value ? m`` : this._isSelectingController.value ? m`<wafir-highlighter></wafir-highlighter>` : m`
      ${this._hasCustomTrigger ? m`<div
            class="trigger-container ${this.position}"
            @click="${this._handleTriggerClick}"
          >
            <slot name="trigger"></slot>
          </div>` : m`
            <div class="trigger-container ${this.position}">
              <button
                @click="${this._handleTriggerClick}"
                part="button"
                aria-label="${this.tooltipText}"
              >
                <span>${Ce(Le)}</span>
              </button>
              <div class="tooltip">${this.tooltipText}</div>
            </div>
          `}
      ${this.isModalOpen ? m`
            <div
              class="modal-backdrop"
              @click="${this._closeModal}"
              role="dialog"
              aria-modal="true"
            >
              <div
                class="modal-content"
                @click="${(e) => e.stopPropagation()}"
              >
                <div class="modal-header">
                  <h3 id="modal-title">${this.modalTitle}</h3>
                  <button
                    class="close-button"
                    @click="${this._closeModal}"
                    aria-label="Close modal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-x-icon lucide-x"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                ${this.isConfigLoading ? m`<div style="padding: 20px; text-align: center;">
                      Loading configuration...
                    </div>` : m`
                      <div class="mode-tabs">
                        ${this._availableTabs.map(
      (e) => m`
                            <button
                              class="mode-tab ${this._activeTab === e.id ? "active" : ""}"
                              @click="${() => this._switchTab(e.id)}"
                            >
                              ${this._renderTabIcon(e.icon)} ${e.label}
                            </button>
                          `
    )}
                      </div>
                      <wafir-form
                        .fields="${this._getActiveFormConfig()}"
                        .showBrowserInfo="${this._activeTab === "issue" && !!this._remoteConfig?.issue?.browserInfo}"
                        .showConsoleLog="${this._activeTab === "issue" && !!this._remoteConfig?.issue?.consoleLog}"
                        .bridgeAvailable="${this.isBridgeAvailable}"
                        @form-submit="${this._handleSubmit}"
                      ></wafir-form>
                    `}
              </div>
            </div>
          ` : ""}

      <wafir-highlighter></wafir-highlighter>
    `;
  }
};
v.styles = [ie(nt)];
C([
  S({ type: String })
], v.prototype, "buttonText", 2);
C([
  S({ type: String })
], v.prototype, "modalTitle", 2);
C([
  S({ type: String })
], v.prototype, "position", 2);
C([
  S({ type: String })
], v.prototype, "tooltipText", 2);
C([
  S({ type: Object })
], v.prototype, "config", 2);
C([
  E()
], v.prototype, "isModalOpen", 2);
C([
  E()
], v.prototype, "isConfigLoading", 2);
C([
  E()
], v.prototype, "configFetchError", 2);
C([
  E()
], v.prototype, "isBridgeAvailable", 2);
C([
  E()
], v.prototype, "_hasCustomTrigger", 2);
C([
  E()
], v.prototype, "_remoteConfig", 2);
C([
  E()
], v.prototype, "_tabConfigs", 2);
C([
  E()
], v.prototype, "_activeTab", 2);
C([
  E()
], v.prototype, "_availableTabs", 2);
C([
  S({ type: Number })
], v.prototype, "installationId", 2);
C([
  S({ type: String })
], v.prototype, "owner", 2);
C([
  S({ type: String })
], v.prototype, "repo", 2);
C([
  S({ type: String })
], v.prototype, "bridgeUrl", 2);
v = C([
  ae("wafir-reporter")
], v);
export {
  v as MyElement
};
