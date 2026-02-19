import { LitElement, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import widgetStyles from "./styles/wafir-widget.css?inline";
import bugIcon from "./assets/bug.svg?raw";
import thumbsupIcon from "./assets/thumbsup.svg?raw";
import lightbulbIcon from "./assets/lightbulb.svg?raw";
import "./wafir-form";
import "./wafir-highlighter";
import {
  isSelecting,
  isCapturing,
  capturedImage,
  clearTabFormData,
  getTabFormData,
  setTabFormData,
  setBrowserInfo,
  setConsoleLogs,
} from "./store.js";
import { StoreController } from "@nanostores/lit";
import type {
  FormConfigApi as FormConfig,
  FieldConfigApi as FieldConfig,
  WafirConfig,
} from "./api/client.js";
import { dataURLtoBlob } from "./utils/file.js";
import { getBrowserInfo, consoleInterceptor } from "./utils/telemetry.js";
import {
  getDefaultForms,
  getDefaultFields,
  getDefaultConfig,
} from "./default-config.js";

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const FORM_ICONS: Record<string, string> = {
  thumbsup: thumbsupIcon,
  lightbulb: lightbulbIcon,
  bug: bugIcon,
};

/**
 * Represents a GitHub Issue Form template structure.
 * Wafir uses the same field schema as GitHub Issue Forms.
 */
interface GitHubIssueFormTemplate {
  name?: string;
  description?: string;
  title?: string;
  labels?: string[];
  assignees?: string[];
  body?: FieldConfig[];
}

@customElement("wafir-widget")
export class WafirWidget extends LitElement {
  @property({ type: String, attribute: "button-text" })
  buttonText = "";

  @property({ type: String, attribute: "modal-title" })
  modalTitle = "Contact Us";

  @property({ type: String })
  position: WidgetPosition = "bottom-right";

  @property({ type: String, attribute: "tooltip-text" })
  tooltipText = "Give Feedback";

  @property({ type: Array })
  forms: FormConfig[] = [];

  @property({ type: String, attribute: "target-type" })
  targetType = "";

  @property({ type: String })
  target = "";

  @property({ type: String, attribute: "auth-ref" })
  authRef = "";

  private _isSelectingController = new StoreController(this, isSelecting);
  private _isCapturingController = new StoreController(this, isCapturing);
  private _capturedImageController = new StoreController(this, capturedImage);

  @state()
  isModalOpen = false;

  @state()
  isConfigLoading = false;

  @state()
  configFetchError: string | null = null;

  @state()
  isBridgeAvailable = true;

  @state()
  private _hasCustomTrigger = false;

  @state()
  private _forms: FormConfig[] = getDefaultForms();

  @state()
  private _activeFormId: string = "feedback";

  // Requested tab from programmatic open() call, to be applied after config loads
  private _requestedTabId: string | null = null;

  static styles = [unsafeCSS(widgetStyles)];

  connectedCallback() {
    super.connectedCallback();
    this._checkCustomTrigger();
    this._mergeInlineForms();
  }

  private _checkCustomTrigger() {
    this._hasCustomTrigger = this.querySelector('[slot="trigger"]') !== null;
  }

  private _mergeInlineForms() {
    if (this.forms && this.forms.length > 0) {
      this._forms = this.forms.map((form) => ({
        ...form,
        body:
          form.body && form.body.length > 0
            ? form.body
            : getDefaultFields(form.id),
      }));
      if (this._forms.length > 0) {
        this._activeFormId = this._forms[0].id;
      }
    }
  }

  public openModal() {
    if (!this.isModalOpen) {
      this._openModal();
    }
  }

  /**
   * Opens the widget programmatically with optional tab selection and prefilled data.
   * @param options - Configuration for opening the widget
   * @param options.tab - The tab ID to open
   * @param options.prefill - Key-value pairs to prefill form fields (fieldId: value)
   */
  public open(options?: { tab?: string; prefill?: Record<string, any> }) {
    // Store the requested tab to apply after config loads
    if (options?.tab) {
      this._requestedTabId = options.tab;
    }

    // Store prefill data to apply after config loads (if modal not yet open)
    if (options?.prefill && !this.isModalOpen) {
      // We'll apply prefill after the modal opens and config is loaded
      // For now, just open the modal
    } else if (options?.prefill && this.isModalOpen) {
      // Modal is already open, apply prefill immediately
      this._applyPrefillData(this._activeFormId, options.prefill);
    }

    // Open the modal (this will trigger config load and tab application)
    if (!this.isModalOpen) {
      this._openModal(options?.prefill);
    } else if (options?.tab) {
      // Modal is already open, just switch tabs
      const tabExists = this._forms.some(
        (t: FormConfig) => t.id === options.tab,
      );
      if (tabExists) {
        this._activeFormId = options.tab!;
        if (options?.prefill) {
          this._applyPrefillData(options.tab, options.prefill);
        }
      } else {
        console.warn(
          `Wafir: Unknown tab "${options.tab}". Available tabs: ${this._forms.map((t: FormConfig) => t.id).join(", ")}`,
        );
      }
    }
  }

  /**
   * Applies prefill data to form fields, validating field IDs against the tab's configuration.
   * @param tabId - The tab ID to apply prefill data to
   * @param prefill - Key-value pairs of field data
   */
  private _applyPrefillData(tabId: string, prefill: Record<string, any>) {
    const form = this._forms.find((t: FormConfig) => t.id === tabId);
    if (!form || !form.body) {
      console.warn(`Wafir: Cannot apply prefill, tab "${tabId}" not found`);
      return;
    }

    // Get valid field IDs from the tab configuration
    const validFieldIds = new Set(
      form.body.map((f: FieldConfig) => String(f.id)),
    );

    // Filter and warn about unknown fields
    const validPrefillData: Record<string, any> = {};
    for (const [fieldId, value] of Object.entries(prefill)) {
      if (validFieldIds.has(fieldId)) {
        validPrefillData[fieldId] = value;
      } else {
        console.warn(
          `Wafir: Unknown field "${fieldId}" for tab "${tabId}". Available fields: ${Array.from(validFieldIds).join(", ")}`,
        );
      }
    }

    // Merge prefill data with existing form data for this tab
    const currentTabData = getTabFormData(tabId);
    const mergedData = { ...currentTabData, ...validPrefillData };
    setTabFormData(tabId, mergedData);
  }

  private async _openModal(prefillData?: Record<string, any>) {
    this.isModalOpen = true;
    setBrowserInfo(getBrowserInfo());
    setConsoleLogs(consoleInterceptor.getLogs());
    await this._checkBridgeHealth();
    await this._fetchConfig();

    // After config is loaded, apply requested tab and prefill
    if (this._requestedTabId) {
      const tabExists = this._forms.some(
        (t: FormConfig) => t.id === this._requestedTabId,
      );
      if (tabExists) {
        this._activeFormId = this._requestedTabId;
      } else {
        console.warn(
          `Wafir: Unknown tab "${this._requestedTabId}". Available tabs: ${this._forms.map((t: FormConfig) => t.id).join(", ")}`,
        );
      }
      this._requestedTabId = null; // Clear after applying
    }

    // Apply prefill data after config and tab are set
    if (prefillData) {
      this._applyPrefillData(this._activeFormId, prefillData);
    }
  }

  private async _handleTriggerClick() {
    if (this.isModalOpen) {
      this._closeModal();
    } else {
      await this._openModal();
    }
  }

  private async _checkBridgeHealth() {
    try {
      const { checkBridgeHealth } = await import("./api/client.js");
      this.isBridgeAvailable = await checkBridgeHealth(
        this.bridgeUrl || undefined,
      );

      if (!this.isBridgeAvailable) {
        console.warn("Wafir: Bridge service is not available");
      }
    } catch (error) {
      console.warn("Wafir: Failed to check bridge health", error);
      this.isBridgeAvailable = false;
    }
  }

  /**
   * Fetches a GitHub issue form template from a URL and extracts fields.
   * @param templateUrl - URL to the template (can be relative)
   * @param baseUrl - Base URL to resolve relative URLs against
   * @returns Template fields and labels, or undefined if fetch fails
   */
  private async _fetchTemplate(
    templateUrl: string,
    baseUrl?: string,
  ): Promise<{ body: FieldConfig[]; labels?: string[] } | undefined> {
    try {
      // Resolve relative URLs against the base config URL
      let resolvedUrl = templateUrl;
      if (
        baseUrl &&
        !templateUrl.startsWith("http://") &&
        !templateUrl.startsWith("https://")
      ) {
        const base = new URL(baseUrl);
        resolvedUrl = new URL(templateUrl, base).toString();
      } else if (
        !templateUrl.startsWith("http://") &&
        !templateUrl.startsWith("https://")
      ) {
        // Resolve against current origin
        resolvedUrl = new URL(templateUrl, window.location.origin).toString();
      }

      const response = await fetch(resolvedUrl, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(
          `Wafir: Failed to fetch template from ${resolvedUrl}: HTTP ${response.status}`,
        );
        return undefined;
      }

      const text = await response.text();
      const yaml = await import("js-yaml");
      const template = yaml.load(text) as GitHubIssueFormTemplate;

      if (!template || !template.body || !Array.isArray(template.body)) {
        console.warn(
          `Wafir: Invalid template format from ${resolvedUrl}: missing body`,
        );
        return undefined;
      }

      return {
        body: template.body,
        labels: template.labels,
      };
    } catch (error) {
      console.warn(
        `Wafir: Error fetching template from ${templateUrl}:`,
        error,
      );
      return undefined;
    }
  }

  /**
   * Processes forms that have templateUrl, fetching and merging template fields.
   * @param forms - Array of form configurations
   * @param baseUrl - Base URL to resolve relative template URLs against
   * @returns Forms with template fields merged in
   */
  private async _processFormTemplates(
    forms: FormConfig[],
    baseUrl?: string,
  ): Promise<FormConfig[]> {
    const processedForms = await Promise.all(
      forms.map(async (form) => {
        // If form has templateUrl and no body defined, fetch from template
        if (form.templateUrl && (!form.body || form.body.length === 0)) {
          const templateData = await this._fetchTemplate(
            form.templateUrl,
            baseUrl,
          );
          if (templateData) {
            return {
              ...form,
              body: templateData.body,
              // Merge template labels with form labels (form labels take priority)
              labels: form.labels?.length
                ? form.labels
                : templateData.labels || form.labels,
            };
          }
        }
        return form;
      }),
    );

    return processedForms;
  }

  private _resolveConfigUrl(configUrl: string): string {
    // If the URL starts with http:// or https://, use it as-is
    if (configUrl.startsWith("http://") || configUrl.startsWith("https://")) {
      return configUrl;
    }

    // Otherwise, resolve relative to current origin (like anchor tags)
    const baseUrl = window.location.origin;
    const url = new URL(configUrl, baseUrl);
    return url.href;
  }

  private async _fetchConfig() {
    if (!this.configUrl) {
      console.warn("Wafir: No configUrl provided, using default configuration");
      const defaultConfig = getDefaultConfig();

      // Merge direct widget properties with default config
      // Use new target-type/target/auth-ref props
      const hasTargetProps = this.target && this.targetType;

      this._config = {
        ...defaultConfig,
        targets: hasTargetProps
          ? [
              {
                id: "default",
                type: this.targetType as "github/issues" | "github/project",
                target: this.target,
                authRef: this.authRef || "0",
              },
            ]
          : defaultConfig.targets,
      };

      await this._applyConfig(this._config);
      return;
    }

    this.isConfigLoading = true;
    this.configFetchError = null;

    try {
      // Resolve relative URLs to same origin
      const resolvedUrl = this._resolveConfigUrl(this.configUrl);

      const response = await fetch(resolvedUrl, {
        method: "GET",
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let config: WafirConfig;

      if (
        contentType.includes("yaml") ||
        contentType.includes("x-yaml") ||
        resolvedUrl.endsWith(".yaml") ||
        resolvedUrl.endsWith(".yml")
      ) {
        // Parse YAML
        const yamlText = await response.text();
        const yaml = await import("js-yaml");
        config = yaml.load(yamlText) as WafirConfig;
      } else {
        // Parse JSON
        config = await response.json();
      }

      // Validate required fields
      if (!config.targets || config.targets.length === 0) {
        console.warn(
          "Wafir: Config missing required fields (targets), using defaults",
          config,
        );
        this._config = getDefaultConfig();
        await this._applyConfig(this._config);
        return;
      }

      this._config = config;
      await this._applyConfig(config, resolvedUrl);
    } catch (error) {
      console.error("Wafir: Failed to fetch remote config, using defaults", {
        error,
        configUrl: this.configUrl,
      });
      this._config = getDefaultConfig();
      await this._applyConfig(this._config);
    } finally {
      this.isConfigLoading = false;
    }
  }

  private async _applyConfig(config: WafirConfig, configUrl?: string) {
    if (config.forms && Array.isArray(config.forms)) {
      // Process forms that have templateUrl to fetch their fields
      const processedForms = await this._processFormTemplates(
        config.forms,
        configUrl,
      );

      this._forms = processedForms.map((form: FormConfig) => ({
        id: form.id,
        label: form.label || this._capitalize(form.id),
        icon: form.icon,
        targets: form.targets,
        body:
          form.body && form.body.length > 0
            ? form.body
            : getDefaultFields(form.id),
      }));
      if (this._forms.length > 0) {
        this._activeFormId = this._forms[0].id;
      }
    } else {
      console.warn("Wafir: No forms in config or forms is not an array");
    }

    if (config.title) {
      this.modalTitle = config.title;
    }
  }

  private _capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private _closeModal() {
    this.isModalOpen = false;
  }

  private _getActiveForm(): FormConfig | undefined {
    return this._forms.find((f) => f.id === this._activeFormId);
  }

  private _getActiveFormConfig(): FieldConfig[] {
    const form = this._getActiveForm();
    const fields = form?.body || [];
    return fields;
  }

  private _switchForm(formId: string) {
    this._activeFormId = formId;
  }

  private _formHasValidTarget(): boolean {
    if (!this._config?.targets?.length) return false;
    const activeForm = this._getActiveForm();
    const formTargets = activeForm?.targets;

    // If targets is explicitly an empty array, this is a submissionless form
    if (Array.isArray(formTargets) && formTargets.length === 0) {
      return false;
    }

    // If targets has values, check if at least one is valid
    if (formTargets?.length) {
      return formTargets.some((id) =>
        this._config!.targets.some((t) => t.id === id),
      );
    }

    // If targets is undefined/omitted, all targets are valid
    return true;
  }

  @property({ type: String, attribute: "config-url" })
  configUrl = "";

  @property({ type: String, attribute: "bridge-url" })
  bridgeUrl = "";

  @state()
  private _config: WafirConfig | null = null;

  private async _handleSubmit(event: CustomEvent) {
    const formData = event.detail.formData as Record<string, unknown>;
    const activeForm = this._getActiveForm();

    if (
      !this._config ||
      !this._config.targets ||
      this._config.targets.length === 0
    ) {
      console.error("Wafir: Missing configuration (targets)");
      alert("Widget configuration error");
      return;
    }

    const { targets } = this._config;

    // Find the target for the active form
    // If form has targets specified, use the first one for validation
    // If form has no targets specified, backend will route to all targets
    const activeFormTargets = activeForm?.targets;
    let targetConfig = targets[0]; // Default to first target

    if (activeFormTargets && activeFormTargets.length > 0) {
      // Use the first target specified for this form
      const targetId = activeFormTargets[0];
      const foundTarget = targets.find(
        (t: { id: string }) => t.id === targetId,
      );
      if (foundTarget) {
        targetConfig = foundTarget;
      } else {
        console.error(
          `Wafir: Form "${activeForm.id}" references unknown target "${targetId}". Available targets: ${targets.map((t) => t.id).join(", ")}`,
        );
        alert("Widget configuration error: Invalid target reference");
        return;
      }
    }

    // Parse owner/repo from target string (format: owner/repo)
    const targetParts = targetConfig.target.split("/");
    const owner = targetParts[0] || "";
    const repo = targetParts[1] || "";

    if (!owner || !repo) {
      console.error(
        "Wafir: Invalid target format. Expected 'owner/repo', got:",
        targetConfig.target,
      );
      alert("Widget configuration error");
      return;
    }

    try {
      const title =
        (formData.title as string) || activeForm?.label || "Submission";
      const labels: string[] = [this._activeFormId];

      const { submitIssue } = await import("./api/client.js");

      const screenshotDataUrl = this._capturedImageController.value;
      const screenshotBlob = screenshotDataUrl
        ? dataURLtoBlob(screenshotDataUrl)
        : undefined;

      // Filter out markdown fields before submission
      const activeFields = this._getActiveFormConfig();
      const submitFields = activeFields.filter((f) => f.type !== "markdown");
      const fieldOrder = submitFields.map((f) => String(f.id));

      // Build field labels map from config
      const fieldLabels: Record<string, string> = {};
      for (const field of submitFields) {
        const id = String(field.id);
        const label = field.attributes?.label;
        if (label) {
          fieldLabels[id] = label;
        }
      }

      // Only send user-data fields in formFields
      const filteredFormData: Record<string, unknown> = {};
      for (const field of submitFields) {
        const id = String(field.id);
        if (formData[id] !== undefined) {
          filteredFormData[id] = formData[id];
        } else if (field.type === "rating") {
          // Always send 0 for rating fields if not set
          filteredFormData[id] = 0;
        }
      }

      // Always send the resolved absolute URL to the backend
      const resolvedConfigUrl = this.configUrl
        ? this._resolveConfigUrl(this.configUrl)
        : "";

      // Note: We send one target for validation, but the backend will determine
      // which targets to actually submit to based on the form's targets array in the config.
      // If the form has no targets specified, the backend will route to all configured targets.
      await submitIssue({
        configUrl: resolvedConfigUrl,
        targetType: targetConfig.type,
        target: targetConfig.target,
        authRef: targetConfig.authRef,
        title,
        formId: this._activeFormId,
        labels,
        screenshot: screenshotBlob,
        bridgeUrl: this.bridgeUrl || undefined,
        formFields: filteredFormData,
        fieldOrder,
        fieldLabels,
      });

      alert("Thank you for your input!");
      clearTabFormData(this._activeFormId);
      capturedImage.set(null);
      this.isModalOpen = false;
    } catch (error) {
      console.error("Wafir: Submit failed", error);
      alert("Failed to submit. Please check configuration.");
    }
  }

  private _renderFormIcon(iconName: string | undefined) {
    if (!iconName) return "";
    return unsafeHTML(FORM_ICONS[iconName] || "");
  }

  render() {
    // During capture, hide with CSS instead of not rendering
    // This preserves component state (like autofill checkbox state)
    const isCapturing = this._isCapturingController.value;

    if (this._isSelectingController.value) {
      return html`<wafir-highlighter></wafir-highlighter>`;
    }

    return html`
      <div style="${isCapturing ? "display: none;" : ""}">
        ${this._hasCustomTrigger
          ? html`<div
              class="trigger-container ${this.position}"
              @click="${this._handleTriggerClick}"
            >
              <slot name="trigger"></slot>
            </div>`
          : html`
              <div class="trigger-container ${this.position}">
                <button
                  @click="${this._handleTriggerClick}"
                  part="button"
                  aria-label="${this.tooltipText}"
                >
                  <span>${unsafeHTML(thumbsupIcon)}</span>
                </button>
                <div class="tooltip">${this.tooltipText}</div>
              </div>
            `}
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

                  <div class="mode-tabs">
                    ${(() => {
                      return this._forms.map(
                        (form) => html`
                          <button
                            class="mode-tab ${this._activeFormId === form.id
                              ? "active"
                              : ""}"
                            @click="${() => this._switchForm(form.id)}"
                          >
                            ${this._renderFormIcon(form.icon)} ${form.label}
                          </button>
                        `,
                      );
                    })()}
                  </div>
                  <wafir-form
                    .tabId="${this._activeFormId}"
                    .fields="${this._getActiveFormConfig()}"
                    .formLabel="${this._getActiveForm()?.label || ""}"
                    .hasValidTarget="${this._formHasValidTarget()}"
                    @form-submit="${this._handleSubmit}"
                  ></wafir-form>
                  ${this.isConfigLoading
                    ? html`
                        <div
                          class="loading-overlay"
                          role="status"
                          aria-live="polite"
                          aria-busy="true"
                        >
                          <div class="loading-content">
                            <div class="spinner" aria-hidden="true"></div>
                            <span class="loading-text">Loading</span>
                          </div>
                        </div>
                      `
                    : ""}
                </div>
              </div>
            `
          : ""}

        <wafir-highlighter></wafir-highlighter>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wafir-widget": WafirWidget;
  }
}
