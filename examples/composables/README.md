# Composables Example

Shows how to build a **fully custom chat UI** using only composables — no `<CopilotChat>` component.

Demonstrates:

- `useCopilotChat` — send messages, get a reactive `messages` array, `isLoading`, `stop`
- `useAgentContext` — register reactive app state the AI can read
- `useFrontendTool` — register a client-side tool the AI can call (e.g. navigate pages)

## Setup

```bash
cp .env.example .env.local
# Edit VITE_COPILOTKIT_RUNTIME_URL in .env.local

pnpm --filter @copilotkit/example-composables dev
```

Open http://localhost:5174

## What to try

- Ask: **"What page am I on?"** — the backend agent can read `currentPage` via `useAgentContext`
- Ask: **"Navigate me to Settings"** — AI calls the `navigate` frontend tool
- Ask: **"What is my name?"** — the backend agent can read `userName` via `useAgentContext`
