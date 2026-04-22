#!/usr/bin/env tsx
/**
 * sync-react-exports.ts
 *
 * Compares the public export surface of @copilotkit/react-core (v2) and
 * @copilotkit/react-ui against the Vue package's exports and reports any
 * symbols that are present in React but missing in Vue.
 *
 * Usage:
 *   pnpm run sync:report
 *   # or after pulling upstream:
 *   pnpm run sync:upstream
 *
 * The script reads source files directly from the copilotkit-src submodule
 * so it works without building the upstream packages.
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const UPSTREAM = path.resolve(ROOT, "copilotkit-src");
const VUE_PKG = path.resolve(ROOT, "packages", "vue", "src");

// ---------- helpers ----------

function readIfExists(filePath: string): string {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch {
        return "";
    }
}

/** Extract exported symbol names from TypeScript source text. */
function extractExports(source: string): Set<string> {
    const symbols = new Set<string>();

    // export { Foo, Bar } / export { Foo as Baz }
    for (const m of source.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const part of m[1].split(",")) {
            const name = part.trim().replace(/\s+as\s+\S+/, "").trim();
            if (name && !name.startsWith("//") && !name.startsWith("*")) {
                symbols.add(name.replace(/^type\s+/, ""));
            }
        }
    }

    // export function/class/const/enum/type/interface Foo
    for (const m of source.matchAll(
        /^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|enum|type|interface)\s+(\w+)/gm,
    )) {
        symbols.add(m[1]);
    }

    // export * from '...' — mark as re-export wildcard (we can't resolve names statically)
    // These are noted but not counted as missing.

    return symbols;
}

function collectExports(indexPath: string): Set<string> {
    const source = readIfExists(indexPath);
    if (!source) return new Set();
    return extractExports(source);
}

// ---------- main ----------

function main() {
    if (!fs.existsSync(UPSTREAM)) {
        console.error(
            "❌  copilotkit-src submodule not found. Run: git submodule update --init",
        );
        process.exit(1);
    }

    const upstreamVersion = JSON.parse(
        readIfExists(path.join(UPSTREAM, "packages", "react-core", "package.json")),
    ).version ?? "unknown";

    console.log(`\n📦  Upstream @copilotkit/react-core version: ${upstreamVersion}\n`);

    const reactIndexes = [
        path.join(UPSTREAM, "packages", "react-core", "src", "v2", "index.ts"),
        path.join(UPSTREAM, "packages", "react-core", "src", "v2", "hooks", "index.ts"),
        path.join(UPSTREAM, "packages", "react-core", "src", "v2", "components", "chat", "index.ts"),
        path.join(UPSTREAM, "packages", "react-core", "src", "v2", "providers", "index.ts"),
        path.join(UPSTREAM, "packages", "react-ui", "src", "index.tsx"),
    ];

    const reactExports = new Set<string>();
    for (const idx of reactIndexes) {
        for (const sym of collectExports(idx)) {
            reactExports.add(sym);
        }
    }

    const vueIndexPath = path.join(VUE_PKG, "index.ts");
    const vueExports = collectExports(vueIndexPath);

    const missing = [...reactExports].filter(
        (sym) =>
            !vueExports.has(sym) &&
            !sym.startsWith("use") === false || // keep hooks
            sym[0] === sym[0].toUpperCase(), // keep components/types
    );

    // Simpler: just show everything missing
    const allMissing = [...reactExports].filter((sym) => !vueExports.has(sym));

    if (allMissing.length === 0) {
        console.log("✅  Vue package is in sync with React — no missing exports.");
    } else {
        console.log(`⚠️   ${allMissing.length} symbol(s) in React not yet in Vue:\n`);
        for (const sym of allMissing.sort()) {
            console.log(`  - ${sym}`);
        }
        console.log(
            "\nAdd these to packages/vue/src/ and re-export them from packages/vue/src/index.ts",
        );
    }

    console.log(`\nReact surface size : ${reactExports.size} exported symbols`);
    console.log(`Vue surface size   : ${vueExports.size} exported symbols\n`);
}

main();
