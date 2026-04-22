---
description: "Run release-readiness checks for this workspace and summarize blockers with clear pass/fail status."
---

Run a release-readiness pass for this repository.

## Goals

- Validate workspace health before release or merge.
- Surface blockers with actionable fixes and clear ownership.

## Commands

Run from repository root:

1. pnpm build
2. pnpm test
3. pnpm check-types
4. pnpm lint
5. pnpm run sync:report

## Output Format

Return:

1. Overall status: PASS or FAIL
2. Per-command result table with status and notable errors
3. Blockers list (only failing or risky items)
4. Suggested next actions in priority order

## Notes

- If a command is too broad for quick iteration, run package-level checks first and clearly label that scope.
- If failures appear unrelated to current changes, still report them, but mark as pre-existing when evidence supports it.
