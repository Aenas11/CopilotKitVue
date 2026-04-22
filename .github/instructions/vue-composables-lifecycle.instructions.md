---
description: "Use when editing Vue composables, adapters, or provider lifecycle glue. Enforce React parity and safe run cleanup behavior."
applyTo: "packages/vue/src/composables/**/*.ts,packages/vue/src/adapters/**/*.ts,packages/vue/src/providers/**/*.ts"
---

# Vue Composable Lifecycle Rules

## Scope

- Apply this guidance when changing composables and lifecycle-related adapters/providers in the Vue package.
- Main target is behavior parity with upstream React semantics, not internal rewrites.

## Source Of Truth

- Read parity context first in [DISCOVERY.md](../../DISCOVERY.md).
- Use upstream reference implementations under [copilotkit-src/packages/react-core](../../copilotkit-src/packages/react-core).
- Follow workspace agent boundaries in [AGENTS.md](../../AGENTS.md).

## Required Behavioral Checks

- Keep run lifecycle transitions correct: start, terminal event, and cleanup on unmount.
- Ensure reactive state is synchronized from the active agent and does not leak stale subscriptions.
- Handle both success and error terminal paths for run status.
- Prefer explicit cleanup helpers for timers and subscriptions.

## Editing Constraints

- Keep changes minimal and localized.
- Reuse @copilotkit/core and @copilotkit/shared APIs instead of custom runtime logic.
- Avoid editing files under copilotkit-src for feature work.

## Verification

Run from repository root unless noted:

- Set-Location ./packages/vue; pnpm check-types
- Set-Location ./packages/vue; pnpm test
- pnpm run sync:report

If public API behavior changed, also run:

- pnpm build
- pnpm test
