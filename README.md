# CopilotKit Vue

Vue 3 native bindings for [CopilotKit](https://github.com/CopilotKit/CopilotKit) — the full-stack SDK for agentic apps, Generative UI, and chat.

> **Status**: In development — see [DISCOVERY.md](./DISCOVERY.md) for the API mapping and build phases.

---

## What this is

`copilotkit-vue` exposes the full CopilotKit feature set to Vue 3 developers via idiomatic Vue composables and Single File Components (SFCs). It reuses the framework-agnostic `@copilotkit/core` and `@copilotkit/shared` packages and does **not** bundle React.

---

## Repository structure

```
copilotkit-vue/
├── packages/
│   └── vue/               # copilotkit-vue — the published Vue package
├── examples/
│   ├── basic/             # basic chat example
│   ├── composables/       # fully composable chat example
│   └── sidebar/           # sidebar chat example
├── scripts/
│   └── sync-react-exports.ts   # upstream drift detector
├── copilotkit-src/        # git submodule → upstream CopilotKit repo (read-only reference)
├── DISCOVERY.md           # full API mapping table & design decisions
├── package.json           # pnpm workspace root
└── pnpm-workspace.yaml
```

### `copilotkit-src` submodule

The original CopilotKit repository is tracked as a **git submodule** pinned to a specific upstream commit. This gives:

- An exact, version-pinned reference to the React implementation we are wrapping
- A local source tree for `scripts/sync-react-exports.ts` to diff against
- A one-command upgrade path when upstream releases a new version

#### Initial setup (after cloning this repo)

```bash
git clone --recurse-submodules https://github.com/your-org/copilotkit-vue.git
cd copilotkit-vue
pnpm install
```

Or if you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --depth 1
pnpm install
```

#### Pulling an upstream CopilotKit upgrade

```bash
# 1. Fetch + checkout latest upstream main
pnpm run sync:upstream

# 2. Review the drift report — lists any React exports not yet in Vue
# 3. Implement missing bindings
# 4. Commit the updated submodule pointer
git add copilotkit-src
git commit -m "chore: bump copilotkit-src to vX.Y.Z"
```

---

## Quick start (once published)

```bash
pnpm add copilotkit-vue
```

```vue
<script setup lang="ts">
import { CopilotKitProvider, useAgent, CopilotChat } from "copilotkit-vue";

const { agent } = useAgent({ agentId: "my_agent" });
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <CopilotChat />
  </CopilotKitProvider>
</template>
```

---

## Development

```bash
pnpm install
pnpm build          # build all packages
pnpm test           # run all tests
pnpm run sync:report  # check API drift against upstream React package
```

---

## License

MIT — same as [CopilotKit](https://github.com/CopilotKit/CopilotKit/blob/main/LICENSE).
