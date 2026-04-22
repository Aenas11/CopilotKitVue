import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const sourcePath = resolve(root, "src/styles/index.css");
const targetPath = resolve(root, "styles/index.css");

const source = readFileSync(sourcePath, "utf8");
const target = readFileSync(targetPath, "utf8");

if (source !== target) {
  console.error("[check:styles] Style files are out of sync.");
  console.error(`  Source: ${sourcePath}`);
  console.error(`  Target: ${targetPath}`);
  console.error("  Run: pnpm --filter copilotkit-vue run sync:styles");
  process.exit(1);
}

console.log("[check:styles] OK - styles are in sync.");
