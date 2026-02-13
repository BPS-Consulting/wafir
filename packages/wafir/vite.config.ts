import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Build modes:
  // - "iife": Single-file IIFE bundle for CDN (minified, all CSS inlined)
  // - default: NPM build (ESM + CJS, lit externalized)
  const isIIFE = mode === "iife";

  // Common define replacements for browser builds
  const browserDefines = {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    "process.versions": "undefined",
    "process.version": "undefined",
  };

  // Helper to copy .d.ts files recursively
  const copyDtsFiles = (srcDir: string, destDir: string) => {
    if (!existsSync(srcDir)) return;
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      const srcPath = resolve(srcDir, entry.name);
      const destPath = resolve(destDir, entry.name);
      if (entry.isDirectory()) {
        copyDtsFiles(srcPath, destPath);
      } else if (entry.name.endsWith(".d.ts")) {
        copyFileSync(srcPath, destPath);
      }
    }
  };

  return {
    define: isIIFE ? browserDefines : {},
    // Don't copy public folder for library builds
    publicDir: false,
    server: {
      port: 5173,
    },
    build: {
      lib: {
        entry: "src/index.ts",
        formats: isIIFE ? ["iife"] : ["es", "cjs"],
        name: "Wafir", // Global name for IIFE build
        fileName: (format) => {
          if (format === "iife") return "wafir.js";
          if (format === "cjs") return "wafir.cjs";
          return "wafir.js";
        },
      },
      rollupOptions: {
        // IIFE: bundle everything; NPM: externalize lit
        external: isIIFE ? [] : /^lit/,
        output: isIIFE
          ? {
              // Process shim banner for browser builds
              banner: `if(typeof globalThis.process==="undefined"){globalThis.process={env:{NODE_ENV:"production"},versions:{node:""},version:""};}`,
              // Ensure single file output (no code splitting)
              inlineDynamicImports: true,
            }
          : {},
      },
      outDir: isIIFE ? "dist/iife" : "dist",
      emptyOutDir: isIIFE ? false : true,
      minify: isIIFE ? "terser" : false,
      // Disable CSS code splitting - inline everything for IIFE
      cssCodeSplit: false,
    },
    plugins: [
      // Only copy CSS files for NPM build (not needed for IIFE since CSS is inlined)
      !isIIFE && {
        name: "copy-css-files",
        closeBundle() {
          const distStyles = resolve(__dirname, "dist/styles");
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
    ].filter(Boolean),
  };
});
