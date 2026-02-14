# Documentation

Customize and extend Wafir to match your needs.

## CSS Customization

Wafir uses Shadow DOM for isolation, but exposes CSS custom properties and `::part()` selectors for customization.

### CSS Custom Properties

Override these variables on the `wafir-widget` element to customize the widget's appearance.

#### Reporter Variables

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
/* Style the trigger button */
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

## Custom Triggers

Replace the default floating button with your own custom trigger element using the `trigger` slot.

### Vanilla HTML Example

```html
<wafir-widget
  target-type="string"   # github/issues | github/project
  target="string"        # e.g., owner/repo or owner/projectNum
  auth-ref="string"       # e.g., GitHub installation ID
>
  <button slot="trigger" class="my-custom-button">Report an Issue</button>
</wafir-widget>
```

> **Tip:** Your custom trigger element should handle its own styling. The widget will automatically open/close the modal when clicked.

---

## Form Configuration

Configure the feedback form fields by placing a `wafir.yaml` file in your app's `public` folder (e.g. `public/wafir.yaml`).
Make sure that it is publically accessible.

**With the new schema, each field is defined using `id`, `type`, `attributes`, and `validations` subkeys.**

### Field Types

| Type         | Description                               | Attributes (required/optional)                                        |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------- |
| `input`      | Single-line text input                    | label, description?, placeholder?, value?                             |
| `email`      | Email input                               | label, description?, placeholder?, value?                             |
| `textarea`   | Multi-line text area                      | label, description?, placeholder?, value?, render?                    |
| `dropdown`   | Dropdown selection                        | label, description?, placeholder?, value?, options, multiple?         |
| `checkboxes` | Multiple checkbox options                 | label, description?, options (array of objects with label, required?) |
| `markdown`   | Read-only Markdown display                | label, description?, value (markdown, required)                       |
| `rating`     | Star rating (displayed as stars, saved as number 1-5) | label, description?, ratingLabels?                       |

### Field Structure

> **Schema Source & Novelty**  
> The overall field schema is inspired by GitHub Issue Forms, but Wafir extends it with the ability to add non-input (static) markdown fields for contextual instructions, help text, sections, and rich formatting within a form.

Each field must be defined as follows:

```yaml
fields:
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

#### Markdown Field Example

A markdown field can be used for headings, hints, or formatted instructions anywhere in your form. Markdown content is rendered securely (sanitized HTML) and is never included in submission data.

```yaml
- id: instructions
  type: markdown
  attributes:
    value: |
      ## Feedback Form
      Please fill out all required fields. Your responses help us improve!
```

#### Field Properties Table

| Property     | Location     | Type         | Description                                     |
| ------------ | ------------ | ------------ | ----------------------------------------------- |
| id           | field (root) | string       | Unique identifier for the field                 |
| type         | field (root) | string       | Field input type (see above)                    |
| attributes   | field (root) | object       | All display/options attributes (see below)      |
| validations  | field (root) | object       | Validation rules (e.g., required: true/false)   |
| label        | attributes   | string       | Display label                                   |
| description  | attributes   | string?      | Helper/description text                         |
| placeholder  | attributes   | string?      | Placeholder text (if supported by type)         |
| value        | attributes   | string?      | Default value or Markdown content               |
| render       | attributes   | string?      | Syntax highlighting for textarea (e.g. shell)   |
| options      | attributes   | array/object | Options for dropdowns or checkboxes             |
| multiple     | attributes   | boolean?     | Allow multiple selections (dropdown only)       |
| ratingLabels | attributes   | array?       | Custom labels for star rating (Wafir extension) |
| required     | validations  | boolean      | If the field is required                        |

---

## Telemetry Options

Wafir can automatically capture browser context to help with debugging. All telemetry is opt-in via configuration in your `public/wafir.yaml` file.

### Available Options

| Option        | Data Collected                                              |
| ------------- | ----------------------------------------------------------- |
| `screenshot`  | DOM-to-canvas screenshot with optional element highlighting |
| `browserInfo` | URL, user agent, viewport size, language                    |
| `consoleLog`  | Recent console messages (errors, warnings, logs)            |

### Configuration

```yaml
telemetry:
  screenshot: true # Enable screenshot capture
  browserInfo: true # Collect browser details
  consoleLog: true # Capture console messages
```

---

## Tabs Configuration

Define the structure of your feedback widget using tabs in your `public/wafir.yaml` config file. Each tab represents a distinct feedback type with its own fields and routing.

### Tab Properties

| Property      | Type      | Description                                                                                      |
| ------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `id`          | string    | Unique identifier for the tab. Also used as the GitHub issue type when creating issues.          |
| `label`       | string    | Display label shown in the tab                                                                   |
| `icon`        | string?   | Icon name (e.g., `bug`, `lightbulb`, `thumbsup`)                                                 |
| `labels`      | string[]? | GitHub labels to auto-apply to issues created from this tab                                      |
| `templateUrl` | string?   | URL to a GitHub issue form template YAML file to use for this tab's fields                       |
| `targets`     | array?    | Array of target IDs to route submissions to                                                      |
| `fields`      | array     | Array of field definitions for this tab                                                          |

> **Note:** The tab `id` is automatically used as the GitHub issue type when creating issues. For example, a tab with `id: Bug` will set the issue type to "Bug" in GitHub (requires issue types to be enabled in your repository/organization).

### Using GitHub Issue Templates

You can reference an existing GitHub issue form template by providing a `templateUrl`. The fields will be fetched from the template:

```yaml
tabs:
  - id: Bug
    label: Report Bug
    icon: bug
    templateUrl: https://raw.githubusercontent.com/owner/repo/main/.github/ISSUE_TEMPLATE/bug_report.yml
    targets: [default]
```

### Configuration Example

```yaml
tabs:
  - id: Bug
    label: Report Bug
    icon: bug
    labels:
      - bug
      - wafir
    targets: [default]
    fields:
      - id: title
        type: input
        attributes:
          label: "Issue Title"
        validations:
          required: true

  - id: Feature
    label: Feature Request
    icon: lightbulb
    labels:
      - enhancement
      - feature-request
    targets: [default]
    fields:
      - id: title
        type: input
        attributes:
          label: "Feature Title"
        validations:
          required: true

  - id: feedback
    label: Feedback
    icon: thumbsup
    labels:
      - feedback
    targets: [project]
    fields:
      - id: rating
        type: rating
        attributes:
          label: "How satisfied are you?"
        validations:
          required: true

```

### Single Tab Mode

If you only need one type of feedback, define a single tab. The tab selector will be hidden automatically:

```yaml
tabs:
  - id: issue
    label: Report Issue
    icon: bug
    fields:
      - id: title
        type: input
        attributes:
          label: "Issue Title"
        validations:
          required: true
```

---

## Target Configuration

The `targets` key in your `public/wafir.yaml` file allows you to define multiple destinations for user feedback, bug reports, and suggestions. Each target is an object specifying its id, type, destination, and authentication reference:

### Example Targets Config

```yaml
targets:
  - id: default
    type: github/issues
    target: your-username/your-repo
    authRef: "YOUR_INSTALLATION_ID" # Replace with your installation ID
  - id: project
    type: github/project
    target: your-username/your-project-id
    authRef: "YOUR_INSTALLATION_ID"
```

Tabs in your configuration reference targets:

```yaml
tabs:
  - id: feedback
    label: Feedback
    icon: thumbsup
    isFeedback: true
    targets: [project] # Routes this tab's feedback to 'project' target
    fields:
      - id: rating
        type: rating
        attributes:
          label: "How satisfied are you with our website?"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "What is the main reason for this rating?"
        validations:
          required: false

  - id: suggestion
    label: Suggestion
    icon: lightbulb
    fields:
      - id: title
        type: input
        attributes:
          label: "What is your suggestion?"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Additional information:"
        validations:
          required: false

  - id: issue
    label: Issue
    icon: bug
    targets: [default] # Routes this tab's feedback to 'default' target
    fields:
      - id: title
        type: input
        attributes:
          label: "What issue did you encounter?"
        validations:
          required: true
      - id: description
        type: textarea
        attributes:
          label: "Additional information:"
        validations:
          required: true
```

---

### Migration from the legacy `storage` configuration

> **Migration Notice:**
> The legacy `storage` key has been **removed**. All feedback routing now uses the `targets` array and tab-level `targets` references. To migrate, define each destination under the `targets` key, and update your tabs to reference the appropriate target via `targets: [targetId]`. See above examples for details.

---

## Configuration Examples

Place your Wafir configuration file in the `public` folder of your app, e.g. `public/wafir.yaml`. We provide ready-to-use configuration templates for common use cases (see `/examples`). All examples use the new targets config format and schema:

Required top-level keys:

- `installationId`: Your numeric GitHub App installation ID
- `targets`: Array of target definitions for feedback routing

- **Basic** — Standard bug reporting setup with targets
- **Minimal** — Simplest possible config
- **Full Featured** — All options demonstrated
- **Privacy Focused** — No automatic data collection
- **Feature Requests** — Optimized for ideas
- **Feedback Focused** — Star rating and satisfaction surveys
