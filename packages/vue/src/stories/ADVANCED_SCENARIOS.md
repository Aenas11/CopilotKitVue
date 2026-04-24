# Advanced Live Agent Stories

This document maps the runtime-backed workflow stories used to validate the full Storybook plus runtime plus agent stack.

## Start The Live Stack

```bash
pnpm --dir ./packages/vue run storybook:dev
```

Then use the `Workflows` section in Storybook.

## How Live Stories Work With The Agent

- Story UI runs in Storybook at `http://localhost:6006`.
- Every live story mounts `StoryRuntimeProvider`, which creates `CopilotKitCore` pointing to `/api/copilotkit`.
- Storybook proxies `/api/copilotkit` to the local runtime at `http://localhost:4000`.
- The runtime forwards to the real examples agent (`my_agent`) at `http://localhost:8000`.
- Result: when you send a message in a live story, you are exercising real runtime + real agent behavior (not mocked transport).

## Quick User Guidance

1. Start stack: `pnpm --dir ./packages/vue run storybook:dev`.
2. Open any story under `Workflows/Live Agent`.
3. Send one of the suggested prompts listed in the story panel.
4. Confirm both chat response and scenario-specific UI behavior (thread switch, tool rendering, attachment queue, etc.).
5. If no response appears, verify runtime (4000) and agent (8000) are both running.

## Story Map

| Story                  | Storybook path                                                  | Why it exists                                                                                                |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Context Sharing Chat   | `Workflows/Live Agent/Advanced Scenarios/State and Tools`       | Verifies AG-UI shared state round-tripping between UI controls and the live agent                            |
| Frontend Tools Chat    | `Workflows/Live Agent/Advanced Scenarios/State and Tools`       | Verifies frontend tool registration and visible side effects in a live loop                                  |
| Multi Thread Chat      | `Workflows/Live Agent/Advanced Scenarios/Threads and Debugging` | Verifies thread isolation and continuity across concurrent conversations                                     |
| Agent State Inspection | `Workflows/Live Agent/Advanced Scenarios/Threads and Debugging` | Exposes low-level `useAgent` state, messages, and run transitions for debugging                              |
| Sidebar And Chat Combo | `Workflows/Live Agent/Advanced Scenarios/Layout Patterns`       | Validates sidebar lifecycle and integration with host app content                                            |
| Suggestions Demo       | `Workflows/Live Agent/Advanced Scenarios/Layout Patterns`       | Validates compact embedded chat layout under constrained dimensions                                          |
| Error Handling         | `Workflows/Live Agent/Advanced Scenarios/Layout Patterns`       | Validates split-pane integration with supporting host UI alongside chat                                      |
| Minimal Composable UI  | `Workflows/Live Agent/Advanced Scenarios/Layout Patterns`       | Provides a baseline full-screen dedicated assistant surface                                                  |
| Render Tool Live       | `Workflows/Live Agent/Advanced Scenarios/Tool Rendering`        | Verifies live `useRenderTool` behavior for runtime-backed tool calls                                         |
| Approval Workflow Live | `Workflows/Live Agent/Advanced Scenarios/Human In The Loop`     | Verifies that the live agent can request operator approval through a frontend tool before a sensitive action |

## Basic And Supporting Live Stories

- `Workflows/Live Agent/Basics` contains the shortest live smoke paths for `CopilotChat` and `CopilotSidebar`.
- `Workflows/Live Agent/Checklist` is the manual pass-fail guide for the live stack.
- `Workflows/Overview` explains when to use workflows instead of deterministic scenarios.

## Implementation Files

```text
packages/vue/src/stories/
├── LiveAgentChat.stories.ts
├── LiveAgentChecklist.stories.ts
├── LiveAgentStateAndTools.stories.ts
├── LiveAgentThreadsAndDebugging.stories.ts
├── LiveAgentLayoutPatterns.stories.ts
├── LiveAgentHumanInTheLoop.stories.ts
├── LiveAgentRenderTool.stories.ts
└── liveAgentStoryShared.ts
```

## Phase C Dedicated Live Stories

The following files provide dedicated runtime-backed coverage for Phase C surfaces. Each file focuses on one component/composable area.

```text
packages/vue/src/stories/
├── LiveAgentUseAttachments.stories.ts
├── LiveAgentAttachmentQueue.stories.ts
├── LiveAgentAttachmentRenderer.stories.ts
├── LiveAgentAudioRecorder.stories.ts
├── LiveAgentUseThreads.stories.ts
├── LiveAgentMCPAppsActivityRenderer.stories.ts
├── LiveAgentOpenGenerativeUIRenderer.stories.ts
└── LiveAgentOpenGenerativeUIToolRenderer.stories.ts
```

Notes:

- All stories use `StoryRuntimeProvider` and are intended to run with `pnpm --dir ./packages/vue run storybook:dev`.
- `LiveAgentUseThreads.stories.ts` includes a platform-gated CRUD scenario. Local examples runtime may return `422` for Threads API endpoints; this is expected outside Intelligence platform environments.
- `LiveAgentUseAttachments.stories.ts` demonstrates the composable-level queue pattern; the base `CopilotChat` component now also supports integrated attachment add/remove/send flow directly in chat input.

## Shared Live Story Pattern

All runtime-backed stories use `StoryRuntimeProvider` from `liveAgentStoryShared.ts` so they share the same provider wiring and scenario-purpose decorator.

## Typical Prompts

- Context sharing: "What page am I on?"
- Frontend tools: "Increment the counter to 5"
- Multi-thread: start separate conversations in Thread A and Thread B
- State inspection: send a message and watch `agentInfo` and `stateJson`
- Render tool: "What is the storybook status?"
- Human approval: "Approve a $50 refund to Jordan Rivera on ticket #12345 for the duplicate charge."

## Adding Another Advanced Workflow Story

1. Place it in the themed file that matches the behavior, or add a new themed file under `packages/vue/src/stories/`.
2. Use `StoryRuntimeProvider` from `liveAgentStoryShared.ts`.
3. Add `live-agent` tags and the scenario-purpose docs description.
4. Keep the story narrowly focused on one runtime-backed behavior.
5. Update `WorkflowsOverview.mdx` and this document if the new story changes the navigation map.

- ✅ Custom UI building
- ✅ State inspection/debugging

---

## Testing These Stories

### Run Storybook

```bash
pnpm --dir ./packages/vue run storybook:dev
```

This starts:

- **Storybook UI:** http://localhost:6006
- **Runtime Server:** http://localhost:4000
- **Agent Server:** http://localhost:8000

### Run Tests

```bash
# Stable test lane (deterministic scenarios only)
pnpm --dir ./packages/vue run test:stories

# Include live stories in tests
pnpm --dir ./packages/vue run test:stories:live
```

### Manual Testing

1. Navigate to **Workflows > Live Agent > Advanced Scenarios**
2. Click on any story
3. Interact with the chat interface
4. Monitor network tab to see API calls
5. Try prompts listed in each story description

---

## Stories Implementation Location

Advanced live workflow stories are defined across themed files:

```
packages/vue/src/stories/LiveAgentStateAndTools.stories.ts
packages/vue/src/stories/LiveAgentThreadsAndDebugging.stories.ts
packages/vue/src/stories/LiveAgentLayoutPatterns.stories.ts
packages/vue/src/stories/LiveAgentHumanInTheLoop.stories.ts
packages/vue/src/stories/LiveAgentRenderTool.stories.ts
packages/vue/src/stories/liveAgentStoryShared.ts
```

Along with:

- `LiveAgentChat.stories.ts` — Workflow basics for live chat and sidebar smoke tests
- `LiveAgentChecklist.stories.ts` — Manual live smoke checklist
- `CopilotChatComplexScenarios.stories.ts` — Deterministic scenario coverage
- `CopilotRenderTool.stories.ts` — Deterministic render-tool coverage
- `CopilotChatInput.stories.ts` — Component-level input stories
- `CopilotChatView.stories.ts` — Component-level chat view stories
- `CopilotPanelStates.stories.ts` — Component-level layout state variations

---

## Architecture Notes

**Story Provider Pattern:**
Each story uses `StoryRuntimeProvider` — an inline component that:

- Creates `CopilotKitCore` instance
- Provides it via Vue's `provide()` API
- Enables composable access without file imports

**Thread Isolation:**
Each story uses a unique `threadId` to keep conversations separate.

**Runtime Connection:**
All stories proxy through Storybook's `/api/copilotkit` endpoint, configured in `.storybook/main.ts` to forward to `http://localhost:4000`.

---

## Next Steps

**To add more stories:**

1. Follow the nearest themed file in `packages/vue/src/stories/`
2. Use `StoryRuntimeProvider` wrapper
3. Call composables in the story's `setup()`
4. Add unique `thread-id` for isolation
5. Tag with `live-agent` if manually tested
6. Document in this file

**To integrate with CI/CD:**

- Use `test:stories` for deterministic, repeatable tests
- Use `test:stories:live` for manual smoke tests on demand
- Configure workflows to run appropriate test lane
