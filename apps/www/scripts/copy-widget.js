import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const srcPath = resolve(__dirname, "../../../packages/wafir/dist-browser/wafir.browser.js");
const destDir = resolve(__dirname, "../public/wafir-widget");
const destPath = resolve(destDir, "wafir.browser.js");

// Create destination directory if it doesn't exist
if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

// Check if source file exists
if (!existsSync(srcPath)) {
  console.error(`Error: Browser bundle not found at ${srcPath}`);
  console.error("Please run 'pnpm run build:browser' in packages/wafir first.");
  process.exit(1);
}

// Copy the file
copyFileSync(srcPath, destPath);
console.log(`✓ Copied wafir.browser.js to ${destPath}`);
