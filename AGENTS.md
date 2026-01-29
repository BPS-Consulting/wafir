# AGENTS.md – Coding & Contribution Guide for Automated Agents

Welcome, coding agent or LLM contributor! This guide documents all commands, code style, and best practices you need for robust agentic work within the Wafir monorepo.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Monorepo Scripts: Build, Lint, Test](#monorepo-scripts)
3. [Running Single & Targeted Tests](#single-tests)
4. [Formatting, Imports, and Style](#formatting-imports-style)
5. [TypeScript & Type Safety](#typescript-safety)
6. [Naming Conventions](#naming-conventions)
7. [Error Handling](#error-handling)
8. [Other Conventions](#other-conventions)
9. [Config References & Keep In Sync](#config-references)

---

## 1. Project Overview

- **Stack:** TypeScript, Lit (Web Components), React, Vue, Fastify (Node API/server), Astro (docs)
- **Monorepo:** Managed with `pnpm` and [Turborepo](https://turbo.build/repo)
- **Major Packages:**
  - `/packages/wafir` – Widget (Lit)
  - `/packages/react`, `/packages/vue` – Framework wrappers
  - `/apps/bridge` – API server (Fastify, Node 18+)
  - `/apps/www` – Docs
- **Testing:** 100% TypeScript, Node.js test runner, all test files in `test/` directories

---

## 2. Monorepo Scripts <a name="monorepo-scripts"></a>

Run all packages from the repo root:

- **Install deps:** `pnpm install`
- **Dev servers:** `pnpm dev` (all packages)
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Check Types:** `pnpm check-types`
- **Format:** `pnpm format` (Prettier across all code)

For individual packages (find exact scripts in each `package.json`):

```bash
pnpm --filter <package> run <script>
# Example: pnpm --filter @wafir/react run build
```

Key scripts for major packages:

- **Widget:** `build`, `build:browser`, `dev`, `generate:api`
- **Bridge:** `build:ts`, `dev`, `test`, `generate:swagger`
- **React/Vue wrappers:** `build`, `dev`, `typecheck`
- **Docs:** `dev`, `build`, `preview`

---

## 3. Running Single & Targeted Tests <a name="single-tests"></a>

- **Bridge tests:** `pnpm --filter bridge run test`
- **Single test file (Node test):**
  ```bash
  cd apps/bridge
  node --test ./test/routes/example.test.ts
  ```
- **Test by name pattern:**
  ```bash
  node --test --test-name-pattern="Some test name" ./test/routes/example.test.ts
  ```
- **All package tests:**
  ```bash
  pnpm --filter <package> run test
  ```
- **Coverage:**
  ```bash
  node --test --experimental-test-coverage
  ```
- See [Node.js test runner docs](https://nodejs.org/api/test.html#filtering-tests-by-name)

---

## 4. Formatting, Imports, and Style <a name="formatting-imports-style"></a>

- **Formatting:** Prettier required for all TS/JS/MD. Run `pnpm format`.
- **Indentation:** 2 spaces.
- **Semicolons:** Mandatory.
- **Quotes:** Prefer single `'`, except for JSON/obj keys.
- **Trailing Commas:** Use where possible.
- **Imports:**
  - Use ESModules syntax.
  - Sort: external → internal → relative.
  - Use `import type { ... }` for types when supported.
  - Prefer destructuring.
- **Linting:** Use each package's linter (eslint recommended).
- **Whitespace:** No trailing spaces; lines ≤ 120 chars.

---

## 5. TypeScript & Type Safety <a name="typescript-safety"></a>

- **Strict mode:** All packages (`strict: true` in tsconfig)
- **No unuseds:** Enforce noUnusedLocals, noUnusedParameters, etc.
- **Prefer interfaces over types** (unless unions/intersections or not extensible).
- **Explicit types:** All function args and return vals.
- **Props/context/state:** Always explicitly typed.
- **Generics over `any`; use `unknown` if needed but always narrow.**
- **Avoid type assertions unless necessary.**
- **Framework specifics:**
  - Lit: Use best practices for type fields/properties + decorators.
  - React: Props must be typed; FC/react forms preferred.

---

## 6. Naming Conventions <a name="naming-conventions"></a>

- **Files:**
  - Non-components: `kebab-case`
  - Components: `PascalCase`
  - Tests: `*.test.ts`, `*.spec.ts`
  - Folders: `kebab-case`
- **Vars/const:** `camelCase`
- **Classes/types/enums:** `PascalCase`
- **Functions:** `camelCase`
- **Lit custom elements:** Use dash, e.g., `<wafir-reporter>`
- **React components:** `PascalCase`, default export unless reason not to.

---

## 7. Error Handling <a name="error-handling"></a>

- Always handle errors, log/warn before throw/discard
- **Async:** Use try/catch on all async/Promises; log unhandled errors
- **API/server:** Endpoints must return meaningful HTTP codes/messages (never raw stack traces)
- **UI:** User-friendly error feedback is required
- **Components:** Show fallback UI for error states (never crash-only)
- Never silently catch unless flow absolutely requires (always log)

---

## 8. Other Conventions <a name="other-conventions"></a>

- **Env variables:** Document new required variables in README and `.env.example`
- **Docs:** Update or create Markdown docs as required; ≤120 char lines
- **Component style:**
  - Lit: State = private fields, props via `@property`, kebab-case events
  - React: Prefer hooks; keep components pure when possible
- **Tests:** Place adjacent to source or in `test/`; use `describe`/`it` with clear names
- **Mocks:** Use [Node test mocks](https://nodejs.org/api/test.html#mocking)

---

## 9. Config References & Keep In Sync <a name="config-references"></a>

- TypeScript config in each package/app gives strict options
- For env setup and secrets, see SETUP.md, testing.md, `.github/wafir.yaml` if present
- Widget/bridge config: `/README.md`, `/QUICKSTART.md`, `/SETUP.md`
- **No Cursor (.cursorrules, .cursor/rules) or Copilot rules are present** as of this writing. If added, update this guide to include them!

---

> **Review AGENTS.md on every update — this is the canonical best-practices reference for agentic operation in this repository. Thank you!**
