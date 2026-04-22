# copilotkit-vue

Vue 3 native bindings for [CopilotKit](https://github.com/CopilotKit/CopilotKit) — the full-stack SDK for agentic apps, Generative UI, and chat.

**Repository:** [github.com/Aenas11/CopilotKitVue](https://github.com/Aenas11/CopilotKitVue)

> **Status:** In active development. APIs are stabilising — see [DISCOVERY.md](../../DISCOVERY.md) for the full API mapping and build phases.

---

## What this is

`copilotkit-vue` exposes the CopilotKit feature set to Vue 3 developers via idiomatic Vue composables and Single File Components (SFCs). It reuses the framework-agnostic `@copilotkit/core` and `@copilotkit/shared` packages and does **not** bundle React.

---

## Install

```bash
pnpm add copilotkit-vue
# or
npm install copilotkit-vue
```

---

## Quick start

```vue
<script setup lang="ts">
import { CopilotKitProvider, useAgent, CopilotChat } from "copilotkit-vue";
import "copilotkit-vue/styles";

const { agent } = useAgent({ agentId: "my_agent" });
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <CopilotChat />
  </CopilotKitProvider>
</template>
```

---

## Composables

| Composable               | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `useAgent`               | Connect to a backend agent and manage its run state                        |
| `useCopilotChat`         | Send messages and get a reactive `messages` array, `isLoading`, and `stop` |
| `useAgentContext`        | Register reactive app state the AI can read                                |
| `useFrontendTool`        | Register a client-side tool the AI can call                                |
| `useCopilotAction`       | Register an action the AI can invoke from the chat                         |
| `useMakeCopilotReadable` | Make app data readable to the AI                                           |

---

## Components

| Component              | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `<CopilotKitProvider>` | Root provider — wraps your app and supplies the runtime URL |
| `<CopilotChat>`        | Ready-made chat panel                                       |
| `<CopilotSidebar>`     | Sidebar chat panel                                          |
| `<CopilotPopup>`       | Floating popup chat                                         |
| `<CopilotTextarea>`    | AI-enhanced textarea with autocomplete                      |

---

## Styles

Import the base stylesheet alongside your component usage:

```ts
import "copilotkit-vue/styles";
```

---

## Examples

| Example                                   | Description                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [basic](../../examples/basic)             | Inline `<CopilotChat>` panel next to app content with a local runtime server                                              |
| [composables](../../examples/composables) | Fully custom chat UI built with `useCopilotChat`, `useAgentContext`, and `useFrontendTool` — no `<CopilotChat>` component |
| [sidebar](../../examples/sidebar)         | Chat delivered via `<CopilotSidebar>`                                                                                     |
| [agent](../../examples/agent)             | Backend agent (C#) used by the example apps                                                                               |

---

## Development

Clone the repo and install dependencies:

```bash
git clone --recurse-submodules https://github.com/Aenas11/CopilotKitVue.git
cd CopilotKitVue
pnpm install
```

Useful commands (run from the workspace root):

```bash
pnpm build            # build all packages
pnpm test             # run all tests
pnpm check-types      # type-check all packages
pnpm lint             # lint the repository
pnpm run sync:report  # check API drift against upstream React package
```

Package-level commands:

```bash
cd packages/vue
pnpm build       # build this package only
pnpm test        # run package tests
pnpm check-types # type-check this package
```

---

## License

MIT — same as [CopilotKit](https://github.com/CopilotKit/CopilotKit/blob/main/LICENSE).
