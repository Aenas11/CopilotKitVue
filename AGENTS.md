# AGENTS.md

Instructions for AI coding agents working in this repository.

## Repo Intent

- This workspace builds and maintains Vue bindings for CopilotKit.
- Primary implementation target: packages/vue.
- Upstream reference source: copilotkit-src (git submodule, treat as read-only unless explicitly bumping submodule version).

## First Reads

- Project overview and setup: [README.md](README.md)
- Vue mapping and design notes: [DISCOVERY.md](DISCOVERY.md)
- Upstream repo agent guidance (reference only): [copilotkit-src/AGENTS.md](copilotkit-src/AGENTS.md)

## Working Boundaries

- Make feature and bug-fix changes in packages/vue and examples at the workspace root.
- Do not modify files under copilotkit-src for local feature work.
- If upstream is intentionally updated, use the documented sync flow in [README.md](README.md) and commit the submodule pointer change.

## Commands

Run from workspace root unless noted.

- Install dependencies: pnpm install
- Build workspace packages: pnpm build
- Run workspace tests: pnpm test
- Type-check workspace packages: pnpm check-types
- Lint repository: pnpm lint
- Format repository: pnpm format
- Check React-to-Vue API drift: pnpm run sync:report

Vue package specific:

- Package build: Set-Location ./packages/vue; pnpm build
- Package tests: Set-Location ./packages/vue; pnpm test
- Package type-check: Set-Location ./packages/vue; pnpm check-types

## Implementation Conventions

- Keep Vue APIs behaviorally aligned with upstream React semantics where intended.
- Prefer minimal, targeted changes over broad refactors.
- Preserve existing naming and file organization in packages/vue/src.
- Reuse @copilotkit/core and @copilotkit/shared APIs instead of re-implementing runtime logic.

## Validation Checklist For Code Changes

- Run relevant package checks first (typically packages/vue).
- If public API or behavior changed, run workspace-level checks.
- For useAgent/useCopilotChat/composable lifecycle changes, verify run-start and run-finish states and unmount cleanup paths.

## Common Pitfalls

- Assuming copilotkit-src files are editable source for this package.
- Forgetting to initialize submodules in fresh clones.
- Changing behavior without checking parity expectations documented in [DISCOVERY.md](DISCOVERY.md).
