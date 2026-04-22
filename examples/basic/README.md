# Basic Chat Example

Inline `<CopilotChat>` panel next to your app content.

This example now includes a local runtime API server with an endpoint at
`/api/copilotkit`, similar to the Next.js route pattern from `@copilotkit/runtime`.

## Architecture

- UI (`vite`) runs on `http://localhost:5173`
- Runtime API server (`runtime-server.mjs`) runs on `http://localhost:4000/api/copilotkit`
- Agent server runs from `examples/agent` (default `http://localhost:8000/`)
- Vite proxies UI calls from `/api/copilotkit` -> `http://localhost:4000/api/copilotkit`

## Setup

1. Copy env template:
   ```
   cp .env.example .env.local
   ```
2. Optionally edit `.env.local`:
   ```
   AGENT_URL=http://localhost:8000/
   RUNTIME_PORT=4000
   VITE_COPILOTKIT_RUNTIME_URL=/api/copilotkit
   ```
3. Start everything:
   ```
   pnpm --filter @copilotkit/example-basic dev
   ```

Open `http://localhost:5174`.
