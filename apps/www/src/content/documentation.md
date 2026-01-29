# Documentation

Customize and extend Wafir to match your needs.

## CSS Customization

Wafir uses Shadow DOM for isolation, but exposes CSS custom properties and `::part()` selectors for customization.

### CSS Custom Properties

Override these variables on the `wafir-reporter` element to customize the widget's appearance.

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
wafir-reporter {
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
wafir-reporter::part(button) {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

wafir-reporter::part(button):hover {
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

### React Example

```jsx
import { WafirReporter } from "@wafir/react";

function App() {
  return (
    <WafirReporter installationId={12345} owner="your-org" repo="your-repo">
      {/* Your custom trigger */}
      <button className="my-custom-button">Report an Issue</button>
    </WafirReporter>
  );
}
```

### Vue Example

```vue
<template>
  <WafirReporter :installation-id="12345" owner="your-org" repo="your-repo">
    <!-- Your custom trigger -->
    <button class="my-custom-button">Report an Issue</button>
  </WafirReporter>
</template>
```

### Vanilla HTML Example

```html
<wafir-reporter installationId="12345" owner="your-org" repo="your-repo">
  <button slot="trigger" class="my-custom-button">Report an Issue</button>
</wafir-reporter>
```

> **Tip:** Your custom trigger element should handle its own styling. The widget will automatically open/close the modal when clicked.

---

## Form Configuration

Configure which fields appear in the feedback form using your `.github/wafir.yaml` file.

### Field Types

| Type         | Description                  | Options                  |
| ------------ | ---------------------------- | ------------------------ |
| `input`      | Single-line text input       | -                        |
| `textarea`   | Multi-line text area         | -                        |
| `dropdown`   | Dropdown selection           | Requires `options` array |
| `checkboxes` | Boolean checkbox             | -                        |
| `rating`     | Likert (stars) Rating System | -                        |

### Field Properties

```yaml
fields:
  - name: priority # Required: unique identifier
    label: "Priority" # Required: display label
    type: select # Required: field type
    options: # Required for select type
      - "Low"
      - "Medium"
      - "High"
      - "Critical"
    required: true # Optional: default false
```

---

## Telemetry Options

Wafir can automatically capture browser context to help with debugging. All telemetry is opt-in via configuration.

### Available Options

| Option        | Data Collected                                              |
| ------------- | ----------------------------------------------------------- |
| `screenshot`  | DOM-to-canvas screenshot with optional element highlighting |
| `browserInfo` | URL, user agent, viewport size, language                    |
| `consoleLog`  | Recent console messages (errors, warnings, logs)            |

### Configuration

```yaml
# .github/wafir.yaml
issue:
  screenshot: true # Enable screenshot capture
  browserInfo: true # Collect browser details
  consoleLog: true # Capture console messages
  labels: ["bug", "needs-triage"]
```

---

## Mode Configuration

Choose what type of input the widget collects.

### Widget Modes

| Mode       | Description                                                          |
| ---------- | -------------------------------------------------------------------- |
| `issue`    | Bug reporting form with title, description, and type (default)       |
| `feedback` | Star rating with optional comments for user satisfaction             |
| `both`     | Tabbed interface allowing users to choose between issue and feedback |

### Configuration

```yaml
# .github/wafir.yaml
mode: issue # Options: issue, feedback, both
```

### When to Use Each Mode

- **`issue`** - Best for bug tracking, feature requests, and detailed reports
- **`feedback`** - Best for customer satisfaction, NPS surveys, quick sentiment
- **`both`** - When you want users to choose what kind of input to provide

### Feedback Mode Example

```yaml
# .github/wafir.yaml
mode: feedback

feedback:
  title: "How are we doing?"
  labels: ["feedback", "user-satisfaction"]
```

When `mode: feedback` is set, users see a 5-star rating component followed by optional comment fields.

---

## Storage Options

Choose where feedback is stored in your GitHub repository.

### Storage Types

| Type      | Description                              |
| --------- | ---------------------------------------- |
| `issue`   | Create GitHub Issues for each submission |
| `project` | Add items to a GitHub Project board      |
| `both`    | Create both an issue and a project item  |

### Cross-Repository Storage

Store feedback in a different repository than where the widget is configured:

```yaml
# .github/wafir.yaml
storage:
  type: issue
  owner: my-org # Different organization
  repo: feedback-repo # Different repository
```

### Project Board Storage

```yaml
# .github/wafir.yaml
storage:
  type: project
  projectNumber: 1 # GitHub Project number from URL
```

### Personal Projects Authentication

GitHub personal projects require additional authorization beyond the standard GitHub App installation. This is due to GitHub API limitations—personal projects can only be accessed with a user access token.

**To enable personal project access:**

1. Visit the [Connect](/connect) page
2. Enter your GitHub App Installation ID
3. Authorize Wafir via GitHub OAuth
4. Your personal projects will now be accessible

> **Note:** Organization projects work automatically with the GitHub App installation. Personal project authorization is only needed for projects owned by individual GitHub accounts.

---

## Configuration Examples

We provide ready-to-use configuration templates for common use cases:

- **[Basic](https://github.com/BPS-Consulting/wafir/tree/main/examples/basic)** — Standard bug reporting setup
- **[Minimal](https://github.com/BPS-Consulting/wafir/tree/main/examples/minimal)** — Simplest possible config
- **[Full Featured](https://github.com/BPS-Consulting/wafir/tree/main/examples/full-featured)** — All options demonstrated
- **[Privacy Focused](https://github.com/BPS-Consulting/wafir/tree/main/examples/privacy-focused)** — No automatic data collection
- **[Feature Requests](https://github.com/BPS-Consulting/wafir/tree/main/examples/feature-requests)** — Optimized for ideas
- **[Feedback Focused](https://github.com/BPS-Consulting/wafir/tree/main/examples/feedback-focused)** — Star rating and satisfaction surveys
