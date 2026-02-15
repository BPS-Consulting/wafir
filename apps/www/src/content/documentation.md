# Documentation

Customize and extend Wafir to match your needs.

## Quick Start

### Widget Attributes

```html
<wafir-widget
  config-url="/wafir.yaml"
  bridge-url="https://your-bridge.example.com"
>
</wafir-widget>
```

Or configure inline without a config file:

```html
<wafir-widget
  target-type="github/issues"
  target="owner/repo"
  auth-ref="YOUR_INSTALLATION_ID"
>
</wafir-widget>
```

### Custom Triggers

Replace the default floating button with your own custom trigger element using the `trigger` slot:

```html
<wafir-widget config-url="/wafir.yaml">
  <button slot="trigger" class="my-custom-button">Report an Issue</button>
</wafir-widget>
```

> **Tip:** Your custom trigger element should handle its own styling. The widget will automatically open/close the modal when clicked.

---

## Configuration File

Configure the feedback widget by placing a `wafir.yaml` file in your app's `public` folder (e.g. `public/wafir.yaml`). Make sure it is publicly accessible.

### Basic Structure

```yaml
title: "Contact Us"

targets:
  - id: default
    type: github/issues
    target: your-username/your-repo
    authRef: "YOUR_INSTALLATION_ID"

forms:
  - id: bug
    label: Report Bug
    icon: bug
    targets: [default]
    body:
      - id: title
        type: input
        attributes:
          label: "Issue Title"
        validations:
          required: true
```

---

## Targets

The `targets` key defines where feedback submissions are routed. Each target specifies a destination type and authentication.

### Target Properties

| Property  | Type   | Description                                                |
| --------- | ------ | ---------------------------------------------------------- |
| `id`      | string | Unique identifier referenced by forms                      |
| `type`    | string | `github/issues` or `github/project`                        |
| `target`  | string | `owner/repo` for issues, `owner/project-number` for projects |
| `authRef` | string | GitHub App installation ID                                 |

### Example

```yaml
targets:
  - id: default
    type: github/issues
    target: your-username/your-repo
    authRef: "YOUR_INSTALLATION_ID"
  - id: project
    type: github/project
    target: your-username/9
    authRef: "YOUR_INSTALLATION_ID"
```

---

## Forms

Forms define the structure of your feedback widget. Each form represents a distinct feedback type with its own fields and routing, displayed as tabs in the widget UI.

### Form Properties

| Property      | Type      | Description                                                              |
| ------------- | --------- | ------------------------------------------------------------------------ |
| `id`          | string    | Unique identifier. Also used as GitHub issue type when creating issues.  |
| `label`       | string    | Display label shown in the form tab                                      |
| `icon`        | string?   | Icon name: `bug`, `lightbulb`, or `thumbsup`                             |
| `labels`      | string[]? | GitHub labels to auto-apply to issues                                    |
| `templateUrl` | string?   | URL to a GitHub issue form template YAML                                 |
| `targets`     | array?    | Array of target IDs to route submissions to                              |
| `body`        | array     | Array of field definitions                                               |

### Example

```yaml
forms:
  - id: Bug
    label: Report Bug
    icon: bug
    labels:
      - bug
    targets: [default]
    body:
      - id: title
        type: input
        attributes:
          label: "Issue Title"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Description"
        validations:
          required: true

  - id: feedback
    label: Feedback
    icon: thumbsup
    targets: [project]
    body:
      - id: rating
        type: rating
        attributes:
          label: "How satisfied are you?"
        validations:
          required: true
```

### Using GitHub Issue Templates

Reference an existing GitHub issue form template by providing a `templateUrl`. The fields will be fetched from the template:

```yaml
forms:
  - id: Bug
    label: Report Bug
    icon: bug
    templateUrl: https://raw.githubusercontent.com/owner/repo/main/.github/ISSUE_TEMPLATE/bug_report.yml
    targets: [default]
```

### Single Form Mode

If you only need one type of feedback, define a single form. The tab selector will be hidden automatically:

```yaml
forms:
  - id: issue
    label: Report Issue
    icon: bug
    body:
      - id: title
        type: input
        attributes:
          label: "Issue Title"
        validations:
          required: true
```

---

## Fields

Each field is defined using `id`, `type`, `attributes`, and `validations` subkeys. The schema is inspired by GitHub Issue Forms, extended with additional field types.

### Field Types

| Type         | Description                                           | Key Attributes                                                        |
| ------------ | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `input`      | Single-line text input                                | label, description?, placeholder?, value?                             |
| `email`      | Email input                                           | label, description?, placeholder?, value?                             |
| `textarea`   | Multi-line text area                                  | label, description?, placeholder?, value?, render?                    |
| `dropdown`   | Dropdown selection                                    | label, options, description?, multiple?                               |
| `checkboxes` | Multiple checkbox options                             | label, options (array of objects with label, required?)               |
| `markdown`   | Read-only Markdown display                            | value (required)                                                      |
| `rating`     | Star rating (1-5)                                     | label, description?, ratingLabels?                                    |
| `date`       | Date picker input                                     | label, description?, value?                                           |

### Field Properties

| Property     | Location     | Type         | Description                                              |
| ------------ | ------------ | ------------ | -------------------------------------------------------- |
| id           | field (root) | string       | Unique identifier for the field                          |
| type         | field (root) | string       | Field input type (see above)                             |
| attributes   | field (root) | object       | Display and options attributes                           |
| validations  | field (root) | object       | Validation rules (e.g., required: true/false)            |
| label        | attributes   | string       | Display label                                            |
| description  | attributes   | string?      | Helper/description text                                  |
| placeholder  | attributes   | string?      | Placeholder text                                         |
| value        | attributes   | string?      | Default value or Markdown content                        |
| render       | attributes   | string?      | Syntax highlighting for textarea (e.g. shell)            |
| options      | attributes   | array        | Options for dropdowns or checkboxes                      |
| multiple     | attributes   | boolean?     | Allow multiple selections (dropdown only)                |
| ratingLabels | attributes   | array?       | Custom labels for star rating                            |
| autofill     | attributes   | string?      | Auto-fill with telemetry data (see Opt-In Telemetry)     |
| required     | validations  | boolean      | If the field is required                                 |

### Basic Field Example

```yaml
body:
  - id: priority
    type: dropdown
    attributes:
      label: "Priority"
      options:
        - "Low"
        - "Medium"
        - "High"
        - "Critical"
    validations:
      required: true
```

### Markdown Field

Markdown fields display formatted content and are never included in submission data:

```yaml
- id: instructions
  type: markdown
  attributes:
    value: |
      ## Feedback Form
      Please fill out all required fields. Your responses help us improve!
```

### Date Field

Date fields render a native date picker with support for dynamic date tokens:

```yaml
- id: target-date
  type: date
  attributes:
    label: "Target Completion Date"
    value: "today+30"
  validations:
    required: false
```

#### Date Value Tokens

| Token        | Example              | Description           |
| ------------ | -------------------- | --------------------- |
| `today`      | `value: "today"`     | Current date          |
| `today+N`    | `value: "today+7"`   | N days in the future  |
| `today-N`    | `value: "today-30"`  | N days in the past    |
| `YYYY-MM-DD` | `value: "2026-03-01"`| Static ISO date       |

> **Note:** Date values are stored and submitted in ISO 8601 format (`YYYY-MM-DD`). When submitting to a GitHub Project, date fields automatically map to project Date fields with matching names.

---

## Opt-In Telemetry

Wafir supports opt-in telemetry through **autofill fields**. These give users explicit control over what data they share by presenting a checkbox they must enable.

### Available Autofill Types

| Value        | Data Collected                                              | User Control                |
| ------------ | ----------------------------------------------------------- | --------------------------- |
| `screenshot` | DOM-to-canvas screenshot with optional element highlighting | Checkbox + capture          |
| `browserInfo`| URL, user agent, viewport size, language                    | Checkbox to include         |
| `consoleLog` | Recent console messages (errors, warnings)                  | Checkbox to include         |

### How It Works

1. Add a `textarea` field with the `autofill` attribute
2. The widget displays an "Include [Label]" checkbox
3. When checked, the field auto-populates with telemetry data
4. Users see exactly what data will be shared before submitting
5. If unchecked, no telemetry data is included

### Example

```yaml
forms:
  - id: bug
    label: Report Bug
    icon: bug
    body:
      - id: title
        type: input
        attributes:
          label: "Issue Title"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Describe the issue"
        validations:
          required: true
      # Opt-in telemetry fields
      - id: browser-info
        type: textarea
        attributes:
          label: "Browser Info"
          autofill: browserInfo
        validations:
          required: false
      - id: screenshot
        type: textarea
        attributes:
          label: "Screenshot"
          autofill: screenshot
        validations:
          required: false
      - id: console-logs
        type: textarea
        attributes:
          label: "Console Logs"
          autofill: consoleLog
        validations:
          required: false
```

---

## JavaScript API

Wafir provides a JavaScript API for programmatically opening the widget, switching tabs, or prefilling fields.

### NPM/Module Usage

```ts
import { wafirWidget } from "wafir";

// Open the widget (default tab)
wafirWidget.open();

// Open a specific tab
wafirWidget.open({ tab: "suggestion" });

// Open with prefilled fields
wafirWidget.open({
  tab: "issue",
  prefill: {
    title: "Crash on upload",
    description: "I experienced a crash when uploading a large file.",
  },
});
```

### Script Tag/CDN Usage

When loaded from a `<script>` tag, the API is available on `window`:

```js
window.wafirWidget.open({
  tab: "feedback",
  prefill: {
    rating: 5,
    description: "Great experience!",
  },
});
```

### API Reference

```ts
interface wafirWidget {
  open(options?: {
    tab?: string;                    // Form ID from your config
    prefill?: Record<string, any>;   // Field ID/value pairs
  }): void;
}
```

#### Notes

- **Queued execution:** You can call `open()` before the widget loads; requests are queued until ready.
- **Tab IDs:** Must match a form `id` in your config. Invalid IDs fall back to the default tab with a warning.
- **Field IDs:** Prefill keys must match field `id`s. Invalid keys are ignored with a warning.
- **Read-only fields:** Prefill does not affect `markdown` fields.

### Example: Custom Button

```html
<button onclick="window.wafirWidget.open({tab: 'suggestion'})">
  Suggest a Feature
</button>
```

---

## Connect Personal Projects

GitHub personal projects require additional authorization beyond the GitHub App installation.

### Why is this needed?

The Wafir GitHub App only has access to organization repositories and projects. Personal projects require separate OAuth authorization.

### How to Connect

1. **Find your Installation ID** from your GitHub App installation URL:
   ```
   github.com/settings/installations/12345678
   ```
   The number at the end is your Installation ID.

2. **Visit the Connect Page** on the Wafir website or your self-hosted instance.

3. **Enter your Installation ID** and click "Authorize with GitHub".

4. **Grant the requested permissions:**
   - `read:user` — Read your GitHub profile
   - `project` — Access your GitHub projects

5. **Complete authorization** and you'll be redirected back with a success message.

### Security & Privacy

- Your access token is stored securely and only used to add issues to your personal projects
- You can revoke access at any time from your GitHub settings
- Wafir never stores or accesses any data beyond what's needed to create project items

### Using Personal Projects

```yaml
targets:
  - id: personal-project
    type: github/project
    target: your-username/project-number
    authRef: "YOUR_INSTALLATION_ID"
```

---

## Configuration Examples

We provide ready-to-use configuration templates in the `/examples` folder:

- **Basic** — Standard bug reporting setup
- **Minimal** — Simplest possible config
- **Full Featured** — All options demonstrated
- **Privacy Focused** — No automatic data collection
- **Feature Requests** — Optimized for ideas
- **Feedback Focused** — Star rating and satisfaction surveys

---

## CSS Customization

Wafir uses Shadow DOM for isolation, but exposes CSS custom properties and `::part()` selectors for customization.

### CSS Custom Properties

Override these variables on the `wafir-widget` element:

#### Widget Variables

| Variable                          | Default                       | Description                  |
| --------------------------------- | ----------------------------- | ---------------------------- |
| `--wafir-font-family`             | System fonts                  | Font stack for all text      |
| `--wafir-font-size`               | `14px`                        | Base font size               |
| `--wafir-text-color`              | `#111827`                     | Primary text color           |
| `--wafir-text-secondary`          | `#6b7280`                     | Secondary/muted text color   |
| `--wafir-primary-color`           | `#2563eb`                     | Primary brand color          |
| `--wafir-primary-hover`           | `#1d4ed8`                     | Primary color on hover       |
| `--wafir-border-color`            | `#e5e7eb`                     | Border color                 |
| `--wafir-button-size`             | `48px`                        | Trigger button size          |
| `--wafir-button-border-radius`    | `50%`                         | Trigger button border radius |
| `--wafir-button-offset`           | `20px`                        | Distance from screen edge    |
| `--wafir-button-icon-size`        | `24px`                        | Icon size inside button      |
| `--wafir-button-shadow`           | `0 4px 12px rgba(0,0,0,0.15)` | Button shadow                |
| `--wafir-button-shadow-hover`     | `0 6px 16px rgba(0,0,0,0.2)`  | Button shadow on hover       |
| `--wafir-tooltip-bg`              | `#1f2937`                     | Tooltip background color     |
| `--wafir-backdrop-color`          | `rgba(0,0,0,0.5)`             | Modal backdrop color         |
| `--wafir-modal-bg`                | `white`                       | Modal background color       |
| `--wafir-modal-border-radius`     | `12px`                        | Modal border radius          |
| `--wafir-modal-max-width`         | `800px`                       | Modal maximum width          |
| `--wafir-modal-padding`           | `20px`                        | Modal header/content padding |
| `--wafir-modal-shadow`            | `0 20px 60px rgba(0,0,0,0.3)` | Modal shadow                 |
| `--wafir-modal-title-font-size`   | `18px`                        | Modal title size             |
| `--wafir-modal-title-font-weight` | `600`                         | Modal title weight           |
| `--wafir-modal-title-color`       | `--wafir-text-color`          | Modal title color            |

#### Form Variables

| Variable                        | Default       | Description                  |
| ------------------------------- | ------------- | ---------------------------- |
| `--wafir-form-text-color`       | `#374151`     | Form text color              |
| `--wafir-form-bg`               | `transparent` | Form background              |
| `--wafir-form-padding`          | `20px`        | Form padding                 |
| `--wafir-form-border-color`     | `#d1d5db`     | Input border color           |
| `--wafir-form-border-radius`    | `6px`         | Input border radius          |
| `--wafir-form-input-padding`    | `10px 12px`   | Input padding                |
| `--wafir-form-input-color`      | `#111827`     | Input text color             |
| `--wafir-form-input-bg`         | `#ffffff`     | Input background             |
| `--wafir-form-primary-color`    | `#2563eb`     | Submit button color          |
| `--wafir-form-primary-hover`    | `#1d4ed8`     | Submit button hover          |
| `--wafir-form-disabled-color`   | `#9ca3af`     | Disabled state color         |
| `--wafir-form-bg-secondary`     | `#f3f4f6`     | Secondary background         |
| `--wafir-form-bg-tertiary`      | `#f9fafb`     | Tertiary background          |
| `--wafir-form-text-secondary`   | `#6b7280`     | Secondary text color         |
| `--wafir-form-telemetry-bg`     | `#f9fafb`     | Telemetry section background |
| `--wafir-form-telemetry-border` | `#e5e7eb`     | Telemetry section border     |
| `--wafir-form-logs-bg`          | `#111827`     | Console logs background      |
| `--wafir-form-logs-text`        | `#f3f4f6`     | Console logs text color      |
| `--wafir-form-log-warn`         | `#fde047`     | Warning log color            |
| `--wafir-form-log-error`        | `#f87171`     | Error log color              |

#### Highlighter Variables

| Variable                            | Default               | Description            |
| ----------------------------------- | --------------------- | ---------------------- |
| `--wafir-highlighter-overlay-bg`    | `rgba(0,0,0,0.1)`     | Overlay background     |
| `--wafir-highlighter-primary-color` | `#2563eb`             | Highlight border color |
| `--wafir-highlighter-highlight-bg`  | `rgba(37,99,235,0.1)` | Highlight fill color   |

### Example

```css
wafir-widget {
  --wafir-primary-color: #6366f1;
  --wafir-primary-hover: #818cf8;
  --wafir-modal-bg: #ffffff;
  --wafir-text-color: #1f2937;
  --wafir-border-color: #e5e7eb;
  --wafir-form-border-radius: 8px;
  --wafir-font-family: "Inter", sans-serif;
}
```

### Part Selectors

Use `::part()` to style specific elements:

```css
wafir-widget::part(button) {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

wafir-widget::part(button):hover {
  background: #059669;
}
```

### Available Parts

| Part Name  | Description                  |
| ---------- | ---------------------------- |
| `button`   | The floating trigger button  |
| `modal`    | The feedback modal container |
| `form`     | The form element             |
| `input`    | Text input fields            |
| `textarea` | Textarea fields              |
| `select`   | Select dropdowns             |
| `submit`   | The submit button            |

---
