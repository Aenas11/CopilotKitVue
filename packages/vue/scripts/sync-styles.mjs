import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = resolve(root, "src/styles/index.css");
const target = resolve(root, "styles/index.css");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

console.log(`[sync-styles] ${source} -> ${target}`);
