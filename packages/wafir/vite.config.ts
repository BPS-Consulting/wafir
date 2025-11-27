import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    build: {
      lib: {
        entry: "src/wafir-reporter.ts",
        formats: ["es"],
      },
      rollupOptions: {
        external: mode === "production" ? "" : /^lit-element/,
      },
    },
    plugins: [tailwindcss()],
  };
});
