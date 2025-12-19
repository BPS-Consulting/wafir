import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    build: {
      lib: {
        entry: "src/wafir-reporter.ts",
        formats: ["es"],
      },
      rollupOptions: {
        external: /^lit/,
      },
    },
    plugins: [
      {
        name: "copy-css-files",
        closeBundle() {
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
