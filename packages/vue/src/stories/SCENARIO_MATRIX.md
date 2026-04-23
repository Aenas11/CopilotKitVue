# Storybook Scenario Matrix

This matrix defines how to develop and validate complex chat behavior in Storybook while keeping CI stable.

## Lanes

| Lane                | Goal                                                                                               | Tag          | Runtime dependency                              | CI default |
| ------------------- | -------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------- | ---------- |
| Component contract  | Deterministic UI and interaction checks with `play` assertions                                     | `stable`     | None                                            | Included   |
| Scenario simulation | Multi-step chat states (streaming, suggestions, open/close continuity) with local state in stories | `stable`     | None                                            | Included   |
| Live agent smoke    | End-to-end behavior against examples runtime + agent                                               | `live-agent` | `storybook:dev` services on `:4000` and `:8000` | Excluded   |

## Recommended flow

1. Build/iterate scenarios in `stable` stories first.
2. Promote only critical real-backend checks to `live-agent` stories.
3. Keep `live-agent` stories short and smoke-oriented to avoid flaky CI.

## Commands

- Default story tests (stable only): `pnpm test:stories`
- Include live-agent stories: `pnpm test:stories:live`
- Storybook with real runtime/agent: `pnpm storybook:dev`
- Storybook testing widget mode: `pnpm storybook:ui:with-tests`

## High-value complex scenarios

1. Streaming run with last user message shows typing state.
2. Suggestion loading state and selection callback behavior.
3. Open/close/re-open panel continuity.
4. Rich assistant content rendering (markdown/code/list).
5. Stop action visible during a running state.
6. Live agent smoke flow through runtime proxy (`/api/copilotkit`).
