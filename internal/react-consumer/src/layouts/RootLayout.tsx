import { NavLink, Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
              <svg
                className="h-5 w-5 text-white"
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
            <span className="text-xl font-bold gradient-text">Wafir Demo</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/features"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Features
            </NavLink>
            <NavLink
              to="/docs"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Docs
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Contact
            </NavLink>
          </div>

          <div className="flex items-center gap-4">
            <button className="btn-secondary text-sm py-2 px-4">Sign In</button>
            <button className="btn-primary text-sm py-2 px-4">
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-surface-800 bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                  <svg
                    className="h-4 w-4 text-white"
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
                <span className="font-bold text-white">Wafir</span>
              </div>
              <p className="text-sm text-surface-400">
                Beautiful bug reporting for modern applications.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Guides
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-surface-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-surface-800 text-center text-sm text-surface-500">
            © 2024 Wafir. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
