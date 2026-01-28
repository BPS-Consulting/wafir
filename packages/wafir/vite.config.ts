import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Check if we're building the browser bundle
  const isBrowserBundle = mode === "browser";

  return {
    define: isBrowserBundle
      ? {
          // Replace Node.js globals for browser compatibility
          // Using "undefined" makes typeof checks work correctly
          "process": "undefined",
        }
      : {},
    build: {
      lib: {
        entry: "src/wafir-reporter.ts",
        formats: isBrowserBundle ? ["iife"] : ["es"],
        name: "Wafir", // Global name for IIFE build
        fileName: (format) => (format === "iife" ? "wafir.browser.js" : "wafir.js"),
      },
      rollupOptions: {
        // Only externalize lit for ES module build (npm consumers)
        // Bundle everything for browser build
        external: isBrowserBundle ? [] : /^lit/,
      },
      // For browser bundle, output to a separate directory
      outDir: isBrowserBundle ? "dist-browser" : "dist",
      emptyOutDir: true,
    },
    plugins: [
      {
        name: "copy-css-files",
        closeBundle() {
          // Only copy CSS files for the main ES build
          if (isBrowserBundle) return;
          
          const distStyles = resolve(__dirname, "dist/styles");
          if (!existsSync(distStyles)) {
            mkdirSync(distStyles, { recursive: true });
          }
          const cssFiles = [
            "reset.css",
            "wafir-reporter.css",
            "wafir-form.css",
            "wafir-highlighter.css",
          ];
          cssFiles.forEach((file) => {
            copyFileSync(
              resolve(__dirname, `src/styles/${file}`),
              resolve(distStyles, file)
            );
          });
        },
      },
    ],
  };
});
