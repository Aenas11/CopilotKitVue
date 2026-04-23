# Live Storybook Structure

This package now separates Storybook content into three layers:

- `Components` for isolated UI contract stories.
- `Scenarios` for deterministic multi-step coverage.
- `Workflows` for runtime-backed and full agentic validation.

## Live Workflow Files

```text
packages/vue/src/stories/
├── ComponentsOverview.mdx
├── ScenariosOverview.mdx
├── WorkflowsOverview.mdx
├── LiveAgentChat.stories.ts
├── LiveAgentChecklist.stories.ts
├── LiveAgentStateAndTools.stories.ts
├── LiveAgentThreadsAndDebugging.stories.ts
├── LiveAgentLayoutPatterns.stories.ts
├── LiveAgentHumanInTheLoop.stories.ts
├── LiveAgentRenderTool.stories.ts
└── liveAgentStoryShared.ts
```

## Sidebar Map

- `Components > Overview`
- `Components > Chat > CopilotChatInput`
- `Components > Chat > CopilotChatView`
- `Components > Layout > Panel States`
- `Scenarios > Overview`
- `Scenarios > Deterministic > Complex Chat`
- `Scenarios > Deterministic > Render Tool`
- `Workflows > Overview`
- `Workflows > Live Agent > Basics`
- `Workflows > Live Agent > Advanced Scenarios > State and Tools`
- `Workflows > Live Agent > Advanced Scenarios > Threads and Debugging`
- `Workflows > Live Agent > Advanced Scenarios > Layout Patterns`
- `Workflows > Live Agent > Advanced Scenarios > Human In The Loop`
- `Workflows > Live Agent > Advanced Scenarios > Tool Rendering`
- `Workflows > Live Agent > Checklist`

## Why The Split Exists

- `LiveAgentStateAndTools.stories.ts` keeps shared-state and frontend-tool flows together.
- `LiveAgentThreadsAndDebugging.stories.ts` groups thread isolation and state inspection.
- `LiveAgentLayoutPatterns.stories.ts` groups embedded and host-layout integrations.
- `LiveAgentHumanInTheLoop.stories.ts` demonstrates an approval gate between the live agent and the host UI.
- `LiveAgentRenderTool.stories.ts` keeps tool-rendering workflow coverage separate and easy to find.
- `liveAgentStoryShared.ts` owns the provider and scenario-purpose decorator so live stories stay consistent.

## Validation Commands

```bash
pnpm --dir ./packages/vue run check-types
pnpm --dir ./packages/vue run build-storybook
```

## Supporting Docs

- `packages/vue/src/stories/ADVANCED_SCENARIOS.md` explains the live workflow stories in detail.
- `packages/vue/src/stories/SCENARIO_MATRIX.md` describes the component, scenario, and live-agent testing lanes.
