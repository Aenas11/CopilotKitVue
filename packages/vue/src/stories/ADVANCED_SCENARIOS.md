# Advanced Live Agent Stories — Feature Demonstrations

This document outlines the 8 live Storybook stories now available in the CopilotKit Vue package to showcase comprehensive feature functionality.

**Access these stories:**

```bash
pnpm --dir ./packages/vue run storybook:dev
```

Then navigate to: **Scenarios > Advanced Agent Features**

---

## Live Stories Overview

### 1. **Context Sharing Chat** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Context Sharing Chat`

**Demonstrates:**

- `useAgent` with AG-UI shared state via `agent.setState(...)`
- Backend `STATE_SNAPSHOT` round-trip from the hosted agent
- Dynamic shared state binding for `userName` and `currentPage`
- User-facing responses grounded in the latest resolved app state

**Try asking:**

- "What page am I on?"
- "Who am I?"
- "Tell me about my current state"
- "Summarize my current state"

**UI Components:**

- Left sidebar: editable input fields for user and page selection
- Left sidebar: live AG-UI state JSON inspector
- Right main area: full CopilotChat interface
- Agent responds from AG-UI shared state, not advisory frontend context

---

### 2. **Frontend Tools Chat** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Frontend Tools Chat`

**Demonstrates:**

- `useFrontendTool` for registering client-side tools
- Tools for reading, incrementing, and resetting a counter
- Real-time tool invocation from agent
- Tool call logging and execution feedback

**Available Tools:**

- `read_counter()` — get current counter value
- `increment_counter(amount)` — increment by specified amount
- `reset_counter()` — reset to zero

**Try asking:**

- "What's the counter value?"
- "Increment the counter to 5"
- "Reset the counter and tell me the value"
- "Increase it by 3 multiple times"

**UI Components:**

- Left sidebar: live counter display, manual increment/decrement buttons, tool execution log
- Right main area: CopilotChat with tool invocation UI

---

### 3. **Multi-Thread Chat** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Multi Thread Chat`

**Demonstrates:**

- Thread-scoped conversation state via `threadId` prop
- Switching between independent conversation threads
- Preserving history per thread
- Thread isolation with same agent

**Threads:**

- **Thread A:** General Chat (default)
- **Thread B:** Proverbs Only
- **Thread C:** Questions

**Try:**

- Send message in Thread A
- Switch to Thread B (independent history)
- Return to Thread A (previous messages preserved)

**UI Components:**

- Top bar: thread selector buttons (A, B, C)
- Main area: CopilotChat with thread-scoped history

---

### 4. **Agent State Inspection** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Agent State Inspection`

**Demonstrates:**

- Low-level `useAgent` composable access
- Reactive agent state, messages, and run status
- Direct composable API without CopilotChat wrapper
- State debugging and inspection

**Displays:**

- Agent info (ID, thread ID, message count, running status)
- Full reactive agent state as JSON
- Live message history
- Loading/error states

**UI Components:**

- Left: Custom message view + input (built with composables)
- Right: State inspector panel showing live agent metadata

---

### 5. **Sidebar And Chat Combo** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Sidebar And Chat Combo`

**Demonstrates:**

- CopilotChat and CopilotSidebar working together
- Independent UI components, same runtime
- Modal/popup pattern for sidebar
- Multi-component coordination

**UI Components:**

- Main area: Full CopilotChat
- Floating sidebar: CopilotSidebar (toggle open/close)
- Both share same agent runtime and thread

**Try:**

- Send message in main chat
- Open sidebar and send different message
- Switch between them

---

### 6. **Suggestions Demo** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Suggestions Demo`

**Demonstrates:**

- `useSuggestions` composable
- Agent-generated suggestion pills
- Auto-populated follow-up suggestions

**UI Components:**

- Standard CopilotChat
- Suggestion pills appear after agent responses

**Note:** Requires agent runtime configured for suggestions

---

### 7. **Error Handling** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Error Handling`

**Demonstrates:**

- Graceful error display
- Error recovery
- User-friendly error messages
- Retry capabilities

**UI Components:**

- Standard CopilotChat with error resilience
- Automatic error message display
- Retry buttons visible on error

---

### 8. **Minimal Composable UI** ✅ Available

**Path:** `Scenarios/Advanced Agent Features → Minimal Composable UI`

**Demonstrates:**

- Building chat UI with `useCopilotChat` composable
- No CopilotChat component — pure composition
- Custom message rendering
- Manual input/send handling

**UI Components:**

- Message history area (blue for user, green for agent)
- Text input field
- Send button with loading state
- Error display
- Loading indicator

**Note:** This is a minimal reference implementation showing how to build custom UI

---

## Core Features Showcased Across Stories

### Composables Used

- ✅ `useCopilotChat` — high-level chat API (sendMessage, stop, reload)
- ✅ `useAgent` — low-level agent subscription and state
- ✅ `useFrontendTool` — register client-side tools
- ✅ `useSuggestions` — agent-generated suggestions
- ✅ `useCopilotKit` — access to root provider context

### Components Used

- ✅ `CopilotChat` — full-featured chat component
- ✅ `CopilotSidebar` — sliding sidebar variant
- ✅ `CopilotChatView` — message display (composable UI)
- ✅ `CopilotChatInput` — input field (composable UI)

### Patterns Demonstrated

- ✅ AG-UI shared state (app state ↔ agent state)
- ✅ Tool calling (agent → app functions)
- ✅ Threading/multi-conversation
- ✅ Component composition
- ✅ Error handling
- ✅ Loading states
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

1. Navigate to **Scenarios > Advanced Agent Features**
2. Click on any story
3. Interact with the chat interface
4. Monitor network tab to see API calls
5. Try prompts listed in each story description

---

## Stories Implementation Location

All stories defined in:

```
packages/vue/src/stories/LiveAgentAdvancedScenarios.stories.ts
```

Along with:

- `LiveAgentChat.stories.ts` — Basic live chat & sidebar
- `CopilotChatComplexScenarios.stories.ts` — Deterministic test scenarios
- `CopilotChatInput.stories.ts` — Input component stories
- `CopilotChatView.stories.ts` — View component stories
- `CopilotPanelStates.stories.ts` — Panel state variations

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

1. Follow the pattern in `LiveAgentAdvancedScenarios.stories.ts`
2. Use `StoryRuntimeProvider` wrapper
3. Call composables in the story's `setup()`
4. Add unique `thread-id` for isolation
5. Tag with `live-agent` if manually tested
6. Document in this file

**To integrate with CI/CD:**

- Use `test:stories` for deterministic, repeatable tests
- Use `test:stories:live` for manual smoke tests on demand
- Configure workflows to run appropriate test lane
