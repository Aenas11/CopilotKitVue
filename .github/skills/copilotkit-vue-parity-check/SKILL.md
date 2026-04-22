---
name: copilotkit-vue-parity-check
description: "Run React-to-Vue parity checks and targeted lifecycle verification. USE FOR: composable changes, run-status bugs, export drift checks, parity validation before PRs."
---

# CopilotKit Vue Parity Check

## Purpose

Provide a repeatable, low-noise workflow to verify Vue behavior remains aligned with upstream React semantics for core composables.

## Use When

- You changed files in packages/vue/src/composables.
- You fixed run lifecycle behavior such as isRunning transitions.
- You touched exports or public API shape in the Vue package.

## Inputs

- Optional focus area: composable name or lifecycle topic.
- Optional file list to limit verification scope.

## Workflow

1. Identify changed Vue files and impacted composables.
2. Find upstream React reference for equivalent behavior in copilotkit-src.
3. Validate lifecycle parity for:
   - run start
   - terminal success
   - terminal error
   - unmount cleanup
4. Run checks:
   - Set-Location ./packages/vue; pnpm check-types
   - Set-Location ./packages/vue; pnpm test
5. Run drift validation:
   - pnpm run sync:report
6. Summarize:
   - parity matches confirmed
   - any intentional deviations
   - follow-up tests to add

## Guardrails

- Treat copilotkit-src as read-only for local feature and bug work.
- Prefer minimal fixes over broad refactors.
- If you cannot confirm parity from code, call it out explicitly as a risk.

## References

- [AGENTS.md](../../../AGENTS.md)
- [README.md](../../../README.md)
- [DISCOVERY.md](../../../DISCOVERY.md)
