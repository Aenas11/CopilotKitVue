---
description: "Run a fast PR check by focusing on changed files in packages/vue first, then escalate to full checks only when needed."
---

Run a two-stage validation pass for this workspace.

## Stage 1: Fast Scoped Validation

1. Get changed files in Vue package:
   - git diff --name-only -- packages/vue
2. If no files changed under packages/vue:
   - Report: "No Vue package changes detected."
   - Stop unless explicitly asked to continue.
3. If files changed under packages/vue:
   - Summarize impacted areas (composables, providers, components, tests, exports).
   - Run quick package checks:
     - Set-Location ./packages/vue; pnpm check-types
     - Set-Location ./packages/vue; pnpm test

## Stage 2: Full Validation (Escalation)

Run full workspace checks only if one of these is true:

- Stage 1 fails.
- Public API, exports, or package-level behavior changed.
- User explicitly requests full validation.

Escalation commands:

1. pnpm build
2. pnpm test
3. pnpm check-types
4. pnpm lint
5. pnpm run sync:report

## Output Format

Return:

1. Stage 1 result: PASS or FAIL
2. Whether Stage 2 was required and why
3. Per-command status summary
4. Blockers and likely owner area
5. Next action list in priority order

## Constraints

- Treat copilotkit-src as read-only reference.
- Call out suspected pre-existing failures separately from new failures.
- Keep report concise and action-oriented.
