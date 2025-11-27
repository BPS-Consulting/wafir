import { LitElement, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import globalStyles from "./index.css?inline";

@customElement("wafir-root")
export class WafirRoot extends LitElement {
  static styles = [unsafeCSS(globalStyles)];
}
