#!/usr/bin/env tsx

/**
 * Generate JSON Schema from TypeScript schema definition
 * Converts wafir-config.ts to a distributable JSON Schema file
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the TypeScript schema
const schemaModule = await import("../src/shared/schemas/wafir-config.ts");
const { wafirConfigSchema } = schemaModule;

// Convert to proper JSON Schema format
// Remove the internal $id from the original schema and use the proper URL
const { $id: _, ...schemaWithoutId } = wafirConfigSchema;

const jsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://raw.githubusercontent.com/wafir-dev/wafir/main/docs/schema/wafir-config.schema.json",
  title: "Wafir Configuration",
  description:
    "Configuration schema for Wafir widget - feedback, bug reports, and telemetry collection",
  ...schemaWithoutId,
};

// Validate the schema using AJV
const ajv = new Ajv({ strict: false });
try {
  ajv.compile(jsonSchema);
  console.log("✅ Schema validation passed");
} catch (error) {
  console.error("❌ Schema validation failed:", error);
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.resolve(__dirname, "../../www/public");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Created directory: ${outputDir}`);
}

// Write the schema file
const outputPath = path.join(outputDir, "wafir-config.schema.json");
fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2) + "\n");

console.log(`✅ JSON Schema generated successfully at: ${outputPath}`);
