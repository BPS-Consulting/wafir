const features = [
  {
    title: "Screenshot Capture",
    description:
      "Capture full-page or element-specific screenshots with a single click. Users can select exactly what they want to report.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    color: "primary",
  },
  {
    title: "Element Highlighting",
    description:
      "Interactive element selector lets users pinpoint exactly which part of the UI has an issue. XPath included automatically.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </svg>
    ),
    color: "accent",
  },
  {
    title: "Annotation Tools",
    description:
      "Draw arrows, rectangles, and add text annotations to screenshots. Make your bug reports crystal clear.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
    color: "green",
  },
  {
    title: "Device Info Collection",
    description:
      "Automatically collect browser version, OS, viewport size, and more. Never ask users for technical details again.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    color: "yellow",
  },
  {
    title: "GitHub Integration",
    description:
      "Reports are sent directly to your GitHub repository as issues. Complete with screenshots, annotations, and metadata.",
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    color: "surface",
  },
  {
    title: "Fully Customizable",
    description:
      "Use CSS custom properties to match the widget to your brand. Change colors, sizes, shadows, and more.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
    color: "pink",
  },
];

const colorMap: Record<string, string> = {
  primary: "from-primary-500/20 to-primary-600/20 text-primary-400",
  accent: "from-accent-500/20 to-accent-600/20 text-accent-400",
  green: "from-green-500/20 to-green-600/20 text-green-400",
  yellow: "from-yellow-500/20 to-yellow-600/20 text-yellow-400",
  surface: "from-surface-500/20 to-surface-600/20 text-surface-300",
  pink: "from-pink-500/20 to-pink-600/20 text-pink-400",
};

export function FeaturesPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Powerful <span className="gradient-text">Features</span>
          </h1>
          <p className="mt-6 text-lg text-surface-400 max-w-2xl mx-auto">
            Everything you need to collect, manage, and act on bug reports from
            your users.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="card card-hover animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[feature.color]}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 card p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            And much more coming soon...
          </h2>
          <p className="text-surface-400 mb-8 max-w-2xl mx-auto">
            We're constantly improving Wafir with new features like video
            recording, console log capture, network request logging, and more.
          </p>
          <button className="btn-primary">Join the Waitlist</button>
        </div>
      </div>
    </div>
  );
}
