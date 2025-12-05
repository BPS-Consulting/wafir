import { defineConfig } from "vite";

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
  };
});
