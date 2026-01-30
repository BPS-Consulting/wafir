import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Determine the build format
  const isBrowserBundle = mode === "browser";

  return {
    define: isBrowserBundle
      ? {
          // Replace Node.js globals for browser compatibility
          "process.env.NODE_ENV": JSON.stringify("production"),
          "process.env": "{}",
          "process.versions": "undefined",
          "process.version": "undefined",
        }
      : {},
    build: {
      lib: {
        entry: "src/wafir-widget.ts",
        formats: isBrowserBundle ? ["iife"] : ["es"],
        name: "Wafir", // Global name for IIFE build
        fileName: (format) =>
          format === "iife" ? "wafir.browser.js" : "wafir.js",
      },
      rollupOptions: {
        // Only externalize lit for ES module build (npm consumers)
        // Bundle everything for browser build
        external: isBrowserBundle ? [] : /^lit/,
        output: isBrowserBundle
          ? {
              // Add a process shim banner for browser builds
              banner: `if(typeof globalThis.process==="undefined"){globalThis.process={env:{NODE_ENV:"production"},versions:{node:""},version:""};}`,
            }
          : {},
      },
      outDir: isBrowserBundle ? "dist/browser" : "dist",
      emptyOutDir: isBrowserBundle ? false : true,
      minify: "terser",
    },
    plugins: [
      {
        name: "copy-css-files",
        closeBundle() {
          const distStyles = resolve(
            __dirname,
            isBrowserBundle ? "dist/browser/styles" : "dist/styles",
          );
          if (!existsSync(distStyles)) {
            mkdirSync(distStyles, { recursive: true });
          }
          const cssFiles = [
            "reset.css",
            "wafir-widget.css",
            "wafir-form.css",
            "wafir-highlighter.css",
          ];
          cssFiles.forEach((file) => {
            copyFileSync(
              resolve(__dirname, `src/styles/${file}`),
              resolve(distStyles, file),
            );
          });
        },
      },
    ],
  };
});
