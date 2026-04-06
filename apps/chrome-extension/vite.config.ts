// Copyright (C) 2024 BPS-Consulting - Licensed under AGPLv3
import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  cpSync,
} from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths ──────────────────────────────────────────────────────────────────────

const root = __dirname;
const src = resolve(root, "src");
const dist = resolve(root, "dist");

// ── Plugin: copy manifest + static assets into dist/ ─────────────────────────

function copyStaticPlugin() {
  return {
    name: "copy-static-chrome-extension",
    closeBundle() {
      // manifest.json
      copyFileSync(
        resolve(root, "manifest.json"),
        resolve(dist, "manifest.json"),
      );

      // icons
      const iconsDir = resolve(dist, "icons");
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
      cpSync(resolve(root, "public/icons"), iconsDir, { recursive: true });

      // wafir IIFE bundle (from workspace package dist)
      const wafirIife = resolve(
        root,
        "node_modules/wafir/dist/iife/wafir.js",
      );
      if (existsSync(wafirIife)) {
        const vendorDir = resolve(dist, "vendor");
        if (!existsSync(vendorDir)) mkdirSync(vendorDir, { recursive: true });
        copyFileSync(wafirIife, resolve(vendorDir, "wafir.iife.js"));
      } else {
        console.warn(
          "[wafir extension] wafir IIFE bundle not found at",
          wafirIife,
          "– run `pnpm --filter wafir build` first.",
        );
      }
    },
  };
}

// ─── Build modes ─────────────────────────────────────────────────────────────
//
// default       → HTML pages + service-worker (ESM, shared chunks OK).
//                 Cleans dist/. Runs copyStaticPlugin.
// "injector"    → injector.ts as a self-contained IIFE classic script.
//                 Does NOT clean dist/.
// "main-world"  → main-world.ts as a self-contained IIFE classic script.
//                 Does NOT clean dist/.
//
// Usage: `vite build && vite build --mode injector && vite build --mode main-world`
//
// Note: manifest-declared content scripts run as classic scripts and cannot use
// ES module `import` syntax. Both content scripts must be built as IIFE bundles.

export default defineConfig(({ mode }) => {
  if (mode === "injector") {
    return {
      publicDir: false,
      build: {
        outDir: resolve(dist, "content"),
        emptyOutDir: false,
        lib: {
          entry: resolve(src, "content/injector.ts"),
          formats: ["iife"],
          name: "WafirExtInjector",
          fileName: () => "injector.js",
        },
        rollupOptions: {
          output: { inlineDynamicImports: true },
          external: [],
        },
      },
    };
  }

  if (mode === "main-world") {
    return {
      publicDir: false,
      build: {
        outDir: resolve(dist, "content"),
        emptyOutDir: false,
        lib: {
          entry: resolve(src, "content/main-world.ts"),
          formats: ["iife"],
          name: "WafirExtMainWorld",
          fileName: () => "main-world.js",
        },
        rollupOptions: {
          output: { inlineDynamicImports: true },
          external: [],
        },
      },
    };
  }

  // Default mode: HTML page (options) + service-worker (both ESM, shared chunks OK).
  return {
    root: src,
    publicDir: false,
    build: {
      outDir: dist,
      emptyOutDir: true, // clean on first (default-mode) build
      rollupOptions: {
        input: {
          "options/index": resolve(src, "options/index.html"),
          "service-worker": resolve(src, "background/service-worker.ts"),
        },
        output: {
          format: "es",
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "[name][extname]",
        },
      },
    },
    plugins: [copyStaticPlugin()],
  };
});
