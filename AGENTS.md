# AGENTS.md – Coding and Contribution Guide for Automated Agents

Welcome, coding agent or LLM contributor! This guide contains all the technical conventions, commands, and best practices you need to operate robustly and helpfully within the Wafir monorepo.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Monorepo Scripts (Build, Lint, Type Check, Test)](#monorepo-scripts)
3. [Running Single/Targeted Tests](#running-single-or-targeted-tests)
4. [Formatting, Imports, and Code Style](#formatting-imports-and-style)
5. [TypeScript & Type Safety](#typescript-and-type-safety)
6. [Naming Conventions](#naming-conventions)
7. [Error Handling](#error-handling)
8. [Other Conventions](#other-conventions)
9. [Config References](#config-references)
10. [Contributions and Pull Requests](#contributions-and-pull-requests)

---

## 1. Project Overview

- **Stack:** TypeScript / Lit (Web Components), React, Vue, Fastify (API/server), Astro (docs)
- **Monorepo:** Managed with `pnpm` and [Turborepo](https://turbo.build/repo) ([pnpm-workspace.yaml](pnpm-workspace.yaml))
- **Key Packages:**
  - `/packages/wafir` – Widget (Lit)
  - `/packages/react` and `/packages/vue` – Framework wrappers
  - `/apps/bridge` – API server (Fastify, Node 18+/ES2022)
  - `/apps/www` – Docs site (Astro)
- **Testing:** Fully TypeScript, Node’s `node:test` runner, all test files under `test/` directories.

---

## 2. Monorepo Scripts <a name="monorepo-scripts"></a>

Run **all** packages in workspaces from root:

- **Install:** `pnpm install`
- **Development (all):** `pnpm dev` (turbo run dev)
- **Build:** `pnpm build` (turbo run build)
- **Lint:** `pnpm lint` (turbo run lint, see package scripts below for specific linters)
- **Type Check (Project):** `pnpm check-types` (turbo run check-types)
- **Formatting:** `pnpm format` (Prettier: `**/*.{ts,tsx,md}`)

You can run package-specific scripts:

- `pnpm --filter <package> run <script>`
  - Example: `pnpm --filter @wafir/react run build`
  - Find scripts in each package’s `package.json`.

#### Example scripts (see each `package.json`):

- **Widget:** `build`, `build:browser`, `dev`, `generate:api`
- **Bridge:** `build:ts`, `dev`, `test`, `generate:swagger`
- **React/Vue wrappers:** `build`, `dev`, `typecheck`
- **Docs:** `dev`, `build`, `preview`

---

## 3. Running Single or Targeted Tests <a name="running-single-or-targeted-tests"></a>

### All Bridge server tests:

```bash
pnpm --filter bridge run test
```

### Single test file (in Bridge):

You can execute a single test file directly with Node.js’s test runner:

```bash
cd apps/bridge
e.g. node --test ./test/routes/example.test.ts
```

Or, run all tests but filter by name:

```bash
# Only run tests whose name matches
node --test --test-name-pattern="example is loaded" ./test/routes/example.test.ts
```

- See [Node.js test runner – test filtering](https://nodejs.org/api/test.html#filtering-tests-by-name)

### All tests in a package:

```bash
pnpm --filter <package> run test
```

### Coverage:

```bash
node --test --experimental-test-coverage
```

---

## 4. Formatting, Imports, and Style <a name="formatting-imports-and-style"></a>

- **Formatting:** Prettier enforced for all TS/JS/MD. Use `pnpm format` before/after PRs.
- **Indentation:** 2 spaces.
- **Semicolons:** Required.
- **Quotes:** Prefer single `'`, except for JSON and object keys.
- **Trailing Commas:** Where valid.
- **Imports:**
  - Use ES modules throughout (`import ... from ...`).
  - Sort by external, then internal, then relative.
  - Import types using `import type { ... }` where supported.
- **Linting:** Use package-specific linter (`eslint` typically; add `.eslintrc*` to packages if not present).
- **Whitespace:** No trailing spaces. No lines > 120 chars.
- **Destructure** ES module imports when possible.

---

## 5. TypeScript and Type Safety <a name="typescript-and-type-safety"></a>

- **All packages use strict TypeScript** (`strict: true` in all tsconfig.json)
  - Enforced: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, etc.
- **Prefer interfaces, then types.**
  - Use `interface` for objects meant for extension.
  - Use `type` for unions/intersections or when not for extension.
- **Types Before Values:**
  - Always type function arguments and return values.
  - For props/context/state, use explicit types.
- **Generics** are preferred to `any`. Use `unknown` if you must but always narrow before use.
- **Avoid type assertions** except where unavoidable.
- **Lit components:**
  - Use [Lit best practices](https://lit.dev/docs/components/properties/)—type fields/properties and use decorators as needed.
- **React (TSX):** All props must be typed (use FC or `React.FunctionComponent` forms).

---

## 6. Naming Conventions <a name="naming-conventions"></a>

- **Files:**
  - TypeScript/JS: `kebab-case` for non-components, `PascalCase` for React/Lit/Vue components.
  - Tests: `*.test.ts`, `*.spec.ts`.
  - Folders: `kebab-case`.
- **Variables, constants:** `camelCase`.
- **Classes, types, enums:** `PascalCase`.
- **Functions:** `camelCase`.
- **Lit custom elements:** Use dash: `<wafir-reporter>`.
- **React components:** `PascalCase` function names/files, export as default unless there’s a reason not to.

---

## 7. Error Handling <a name="error-handling"></a>

- **Always handle errors or log/warn before throwing or discarding.**
- **Async:** Use `try/catch` in all async/Promise code. Any unhandled async errors must be reported via logs.
- **API/server:** All endpoints must return meaningful HTTP codes/messages, never raw stack traces.
- **UI:** Show user-friendly error feedback where possible.
- **Lit/React:** For event handlers/components, show fallback UI or messaging (no crash-only behavior).
- **Never** silently catch unless required for flows (and then log!).

---

## 8. Other Conventions <a name="other-conventions"></a>

- **Environment variables:** Document any new variable in the applicable README and `.env.example`.
- **Documentation:** Update or create guides as necessary. Use Markdown, keep lines < 120 chars.
- **Component style:**
  - Lit: State in private fields, props via `@property`, event names as kebab-case.
  - React: Use hooks, keep components pure where possible.
- **Test structure:**
  - Place tests adjacent to source or under `test/`.
  - Prefer `describe`/`it` or `test` blocks with clear, human-friendly names.
- **Mocks:** Use [Node test mocks](https://nodejs.org/api/test.html#mocking) for spying, stubbing as needed.

---

## 9. Config References <a name="config-references"></a>

- **TypeScript config:** See `tsconfig.json` in each package/app for strict mode flags and root includes.
- **Example environment setup:** See `SETUP.md`, `testing.md`, `.github/wafir.yaml` for usage and .env variables.
- **Wafir widget and bridge configuration:** See `/README.md`, `/QUICKSTART.md`, `/SETUP.md`.

---

## 10. Contributions and Pull Requests <a name="contributions-and-pull-requests"></a>

- **Branches:** Use `feature/your-feature-name`, `bugfix/your-bug-description` naming.
- **Commits:** Clear and specific, imperative style ("Add issue triage field", not "Added...").
- **Open a PR:** After ensuring all tests, lint, and type checks pass.
- **PR review:** Runs auto-checks. You must address all comments/failures.
- **No Copilot/Cursor/Codestyle rules:** No `.cursorrules`, `.cursor/rules`, or `.github/copilot-instructions.md` found as of this writing. If these are added in the future, integrate them here.

---

> **Always consult the AGENTS.md on every update—it will be kept current with future coding conventions or config changes. Thank you!**
