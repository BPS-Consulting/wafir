import { useState } from "react";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `
## Installation

Install Wafir using your preferred package manager:

\`\`\`bash
npm install wafir
# or
pnpm add wafir
# or
yarn add wafir
\`\`\`

## Basic Usage

Import and use the web component in your application:

\`\`\`html
<script type="module">
  import 'wafir';
</script>

<wafir-widget
  installation-id="123"
  owner="your-org"
  repo="your-repo"
></wafir-widget>
\`\`\`

For React applications, use the \`@wafir/react\` wrapper:

\`\`\`tsx
import { WafirWidget } from '@wafir/react';

function App() {
  return (
    <WafirWidget
      installationId={123}
      owner="your-org"
      repo="your-repo"
    />
  );
}
\`\`\`
    `,
  },
  {
    id: "customization",
    title: "Customization",
    content: `
## CSS Custom Properties

Wafir uses CSS custom properties for easy theming. Override these in your stylesheet:

\`\`\`css
wafir-widget {
  --wafir-primary-color: #7c3aed;
  --wafir-primary-hover: #6d28d9;
  --wafir-button-size: 56px;
  --wafir-modal-border-radius: 16px;
}
\`\`\`

## Available Properties

| Property | Description | Default |
|----------|-------------|---------|
| \`--wafir-primary-color\` | Primary button color | \`#0ea5e9\` |
| \`--wafir-button-size\` | Floating button size | \`48px\` |
| \`--wafir-modal-bg\` | Modal background | \`#1f2937\` |
| \`--wafir-text-color\` | Main text color | \`#f3f4f6\` |
    `,
  },
  {
    id: "api-reference",
    title: "API Reference",
    content: `
## Component Props

### WafirWidget

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| \`installationId\` | \`number\` | Yes | GitHub App installation ID |
| \`owner\` | \`string\` | Yes | Repository owner |
| \`repo\` | \`string\` | Yes | Repository name |

## Events

The component emits custom events you can listen to:

\`\`\`javascript
const reporter = document.querySelector('wafir-widget');

reporter.addEventListener('wafir-submit', (e) => {
  console.log('Bug report submitted:', e.detail);
});

reporter.addEventListener('wafir-cancel', () => {
  console.log('User cancelled the report');
});
\`\`\`
    `,
  },
  {
    id: "integration",
    title: "Integration",
    content: `
## GitHub App Setup

1. Create a GitHub App with the following permissions:
   - Repository: Issues (Read & Write)
   - Repository: Contents (Read)

2. Install the app on your repository

3. Note your installation ID from the URL:
   \`https://github.com/settings/installations/{installation_id}\`

## Backend Configuration

Configure the Wafir backend service to handle submissions:

\`\`\`bash
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY_PATH=/path/to/private-key.pem
GITHUB_WEBHOOK_SECRET=your-webhook-secret
\`\`\`
    `,
  },
];

export function DocsPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[250px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              <h4 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">
                Documentation
              </h4>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? "bg-primary-500/10 text-primary-400 border-l-2 border-primary-500"
                      : "text-surface-400 hover:text-white hover:bg-surface-800"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          <main>
            <div className="lg:hidden mb-8">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="input"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="card prose prose-invert max-w-none">
              {sections
                .filter((s) => s.id === activeSection)
                .map((section) => (
                  <div key={section.id}>
                    <h1 className="text-3xl font-bold text-white mb-8">
                      {section.title}
                    </h1>
                    <div className="space-y-6 text-surface-300">
                      <DocContent content={section.content} />
                    </div>
                  </div>
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function DocContent({ content }: { content: string }) {
  const parts = content.trim().split(/```(\w+)?\n([\s\S]*?)```/g);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      const text = parts[i];
      if (text.trim()) {
        const lines = text.split("\n").map((line, j) => {
          if (line.startsWith("## ")) {
            return (
              <h2 key={j} className="text-2xl font-bold text-white mt-8 mb-4">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith("| ")) {
            return null;
          }
          if (line.trim()) {
            return (
              <p key={j} className="leading-relaxed">
                {line}
              </p>
            );
          }
          return null;
        });
        elements.push(...lines.filter(Boolean));
      }
    } else if (i % 3 === 1) {
      // Skip
    } else {
      const code = parts[i];
      const lang = parts[i - 1] || "text";
      elements.push(
        <pre
          key={i}
          className="bg-surface-900 border border-surface-700 rounded-xl p-4 overflow-x-auto"
        >
          <code className={`language-${lang} text-sm text-surface-200`}>
            {code}
          </code>
        </pre>,
      );
    }
  }

  return <>{elements}</>;
}
