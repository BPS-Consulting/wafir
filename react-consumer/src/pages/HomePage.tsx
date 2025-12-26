import { WafirReporter } from "@wafir/react";

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="animate-fade-in">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
              </span>
              Now available for React
            </span>
          </div>

          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-7xl animate-slide-up">
            Beautiful bug reporting
            <br />
            <span className="gradient-text">made simple</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-surface-400 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            Capture screenshots, annotate issues, and send detailed bug reports
            directly from your application. Modern, lightweight, and
            customizable.
          </p>

          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            <button className="btn-primary">
              Get Started
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
            <button className="btn-secondary">View Documentation</button>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-surface-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">
              Why choose <span className="gradient-text">Wafir</span>?
            </h2>
            <p className="mt-4 text-surface-400 max-w-2xl mx-auto">
              Everything you need for seamless bug reporting, built with modern
              web standards.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card card-hover">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400">
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
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Screenshot Capture
              </h3>
              <p className="text-surface-400">
                One-click screenshot capture with automatic element highlighting
                and annotation tools.
              </p>
            </div>

            <div className="card card-hover">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-600/20 text-accent-400">
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
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Fully Customizable
              </h3>
              <p className="text-surface-400">
                CSS custom properties let you match the widget perfectly to your
                brand and design system.
              </p>
            </div>

            <div className="card card-hover">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-400">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Lightweight
              </h3>
              <p className="text-surface-400">
                Built with Lit for minimal footprint. No heavy frameworks, just
                pure web components.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <h2 className="section-title mb-6">
                Try it <span className="gradient-text">live</span>
              </h2>
              <p className="text-surface-400 mb-8">
                Click the floating button in the bottom-right corner to open the
                bug reporter. You can capture screenshots, annotate issues, and
                see the full workflow.
              </p>
              <ul className="space-y-4">
                {[
                  "Capture full-page or element screenshots",
                  "Annotate with drawing tools and text",
                  "Automatic browser & device info collection",
                  "Integrates with GitHub Issues",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-surface-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="card p-8">
                <div className="aspect-video rounded-xl bg-surface-700/50 flex items-center justify-center border border-surface-600/50">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 animate-float">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </div>
                    <p className="text-surface-400">Bug reporter preview</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-primary-500/20 blur-2xl" />
              <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-accent-500/20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="section-title mb-6">
            Ready to improve your
            <br />
            <span className="gradient-text">bug reporting workflow</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-surface-400 mb-10">
            Start collecting better bug reports today. Free for open source
            projects.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="btn-primary">Start Free Trial</button>
            <button className="btn-secondary">Schedule Demo</button>
          </div>
        </div>
      </section>

      <WafirReporter installationId={0} owner="" repo="">
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            border: "none",
            borderRadius: "9999px",
            color: "white",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(99, 102, 241, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 14px rgba(99, 102, 241, 0.4)";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Report a Bug
        </button>
      </WafirReporter>
    </>
  );
}
