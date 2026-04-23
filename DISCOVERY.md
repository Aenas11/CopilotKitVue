# CopilotKit Vue Wrapper — Discovery Report

> Generated: 2026-04-22  
> Source commit: `main` (shallow clone v1.56.2)

---

## 1. Monorepo Package Inventory

| Package              | npm name                         | React dep      | Purpose                                                                           | Reusable by Vue?                                                        |
| -------------------- | -------------------------------- | -------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`               | `@copilotkit/core`               | ❌ none        | `CopilotKitCore` class, agent registry, threads, state manager, suggestion engine | ✅ **Direct reuse**                                                     |
| `shared`             | `@copilotkit/shared`             | ❌ none        | Types, constants, utils, telemetry, attachments, schema helpers                   | ✅ **Direct reuse**                                                     |
| `runtime`            | `@copilotkit/runtime`            | ❌ none        | Server-side runtime (Node/Express/Hono) — client does not import this             | ✅ server-side                                                          |
| `runtime-client-gql` | `@copilotkit/runtime-client-gql` | ❌ none        | GraphQL client for runtime                                                        | ✅ **Direct reuse**                                                     |
| `react-core`         | `@copilotkit/react-core`         | ✅ React 18/19 | Provider, hooks, Chat UI components (v1+v2)                                       | ❌ **Port to Vue**                                                      |
| `react-ui`           | `@copilotkit/react-ui`           | ✅ React 18/19 | Legacy chat UI, CopilotSidebar, CopilotPopup                                      | ❌ **Port to Vue**                                                      |
| `react-textarea`     | `@copilotkit/react-textarea`     | ✅ React 18/19 | AI-enhanced textarea                                                              | ❌ **Port to Vue**                                                      |
| `a2ui-renderer`      | `@copilotkit/a2ui-renderer`      | ✅ React peer  | A2UI (declarative Generative UI) renderer                                         | ⚠️ **Partially portable** — core `@a2ui/web_core` is framework-agnostic |
| `voice`              | `@copilotkit/voice`              | ?              | Voice/transcription support                                                       | ⚠️ needs inspection                                                     |
| `web-inspector`      | `@copilotkit/web-inspector`      | ?              | Debug inspector (Lit-based)                                                       | ✅ likely reusable                                                      |
| `angular`            | N/A                              | ❌ Angular     | Angular bindings — useful as a second reference implementation                    | 📖 reference                                                            |

---

## 2. Framework-Agnostic Core (the foundation for Vue bindings)

### `@copilotkit/core` exports

```
CopilotKitCore           — main state & agent orchestration class
CopilotKitCoreReact      — React-specific subclass (we skip this)
AgentRegistry            — manages agent instances
ContextStore             — shared state store
SuggestionEngine         — generates chat suggestions
RunHandler               — manages agent run lifecycle
StateManager             — syncs agent state
ProxiedCopilotRuntimeAgent
CopilotKitCoreRuntimeConnectionStatus
SubscribeToAgentSubscriber (type)
FrontendTool (type)
ToolCallStatus (enum)
CopilotRuntimeTransport (type)
Suggestion / SuggestionsConfig / DynamicSuggestionsConfig (types)
```

### `@copilotkit/shared` exports

```
Types: Message, ToolCall, AssistantMessage, UserMessage, etc. (via @ag-ui/client)
Attachments types
Constants (DEFAULT_AGENT_ID, etc.)
Telemetry helpers
schemaToJsonSchema, StandardSchemaV1
createLicenseContextValue / LicenseContextValue
COPILOTKIT_VERSION
```

### `@ag-ui/client` (transitive, re-exported by core)

```
AbstractAgent, HttpAgent, HttpAgentConfig
RunAgentInput, RunAgentParameters, RunAgentResult
AgentSubscriber
BaseEvent, TextMessageStartEvent, TextMessageContentEvent, ...
```

---

## 3. React API Surface → Vue Mapping Table

### 3.1 Providers / Context

| React (react-core v2)              | Vue equivalent                             | Implementation notes                                                |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `CopilotKitProvider` (component)   | `CopilotKitProvider` (Vue component)       | Wraps `CopilotKitCore` instance; uses `provide()` to inject context |
| `useCopilotKit()`                  | `useCopilotKit()` composable               | `inject(CopilotKitKey)` → returns `{ copilotkit: CopilotKitCore }`  |
| `CopilotChatConfigurationProvider` | `CopilotChatConfigurationProvider` (Vue)   | Chat-level threadId & labels config via `provide/inject`            |
| `useCopilotChatConfiguration()`    | `useCopilotChatConfiguration()` composable | inject from nearest chat config provider                            |
| `SandboxFunctionsContext`          | `SandboxFunctionsProvider` (Vue)           | For open Generative UI sandboxed functions                          |

### 3.2 Agent & State Hooks → Composables

| React hook                                    | Vue composable               | Key implementation detail                                                                   |
| --------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `useAgent({ agentId, threadId, throttleMs })` | `useAgent(...)`              | Subscribes through `CopilotKitCore` and keeps `messages`, `state`, and `isRunning` reactive |
| `useAgentContext(input)`                      | `useAgentContext(input)`     | Registers component state in agent context store                                            |
| `useCoAgent(options)`                         | `useCoAgent(options)`        | Legacy v1 composable — thin wrapper over `useAgent`                                         |
| `useCoAgentStateRender(...)`                  | `useCoAgentStateRender(...)` | Registers a render function for agent state                                                 |

### 3.3 Tool Hooks → Composables

| React hook                        | Vue composable                    | Key implementation detail                                                           |
| --------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `useFrontendTool(tool, deps)`     | `useFrontendTool(tool, deps)`     | Registers a frontend tool object; re-registers when the tool or watched deps change |
| `useRenderToolCall(name, render)` | `useRenderToolCall(name, render)` | Maps tool call → Vue component via `defineComponent` slot/render fn                 |
| `useRenderTool(name, options)`    | `useRenderTool(name, options)`    | v2 version; supports streaming states (running/complete)                            |
| `useDefaultRenderTool()`          | `useDefaultRenderTool()`          | Fallback renderer for unhandled tool calls                                          |
| `useHumanInTheLoop(options)`      | `useHumanInTheLoop(options)`      | Registers interrupt handler; resolves via `Promise`                                 |
| `useInterrupt(config)`            | `useInterrupt(config)`            | v2 interrupt hook                                                                   |
| `useLangGraphInterrupt()`         | `useLangGraphInterrupt()`         | LangGraph-specific interrupt composable                                             |
| `useComponent(name, component)`   | `useComponent(name, component)`   | Registers a named Vue component in the agent's component registry                   |

### 3.4 Chat Hooks → Composables

| React hook                          | Vue composable                      | Key implementation detail                                                              |
| ----------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `useCopilotChat(options)`           | `useCopilotChat(options)`           | Returns `{ messages, sendMessage, reload, stop, isLoading }` — uses `ref` / `computed` |
| `useCopilotChatHeadless(options)`   | `useCopilotChatHeadless(options)`   | Headless (no UI dependency) chat composable                                            |
| `useCopilotChatSuggestions(config)` | `useCopilotChatSuggestions(config)` | Suggestion configuration composable                                                    |
| `useSuggestions(config)`            | `useSuggestions(config)`            | v2 suggestions composable                                                              |
| `useConfigureSuggestions(config)`   | `useConfigureSuggestions(config)`   | Configure global suggestions                                                           |

### 3.5 Readable / Actions → Composables

| React hook                              | Vue composable                          | Key implementation detail                                        |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `useCopilotReadable(options)`           | `useCopilotReadable(options)`           | Registers context text; uses `watch` to update on `value` change |
| `useMakeCopilotDocumentReadable(doc)`   | `useMakeCopilotDocumentReadable(doc)`   | Wraps document in readable store                                 |
| `useCopilotAction(options)`             | `useCopilotAction(options)`             | Registers backend action; unregisters on unmount                 |
| `useCopilotAdditionalInstructions(...)` | `useCopilotAdditionalInstructions(...)` | Appends system-prompt instructions                               |

### 3.6 Capability / Thread Hooks → Composables

| React hook              | Vue composable          | Notes                                                                       |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `useCapabilities()`     | `useCapabilities()`     | Returns runtime capability flags                                            |
| `useThreads(input)`     | `useThreads(input)`     | Manages thread list; returns `{ threads, createThread, deleteThread, ... }` |
| `useAttachments(props)` | `useAttachments(props)` | Manages file attachment state                                               |

### 3.7 UI Components → Vue Single-File Components (SFCs)

| React component                 | Vue SFC                             | Notes                                             |
| ------------------------------- | ----------------------------------- | ------------------------------------------------- |
| `CopilotKitProvider`            | `CopilotKitProvider.vue`            | Provider wrapper only, no visual output           |
| `CopilotChat`                   | `CopilotChat.vue`                   | Full chat window; composes sub-components below   |
| `CopilotSidebar`                | `CopilotSidebar.vue`                | Slide-in sidebar container                        |
| `CopilotPopup`                  | `CopilotPopup.vue`                  | Floating popup container                          |
| `CopilotChatView`               | `CopilotChatView.vue`               | Inner chat view (scrollable message list + input) |
| `CopilotChatInput`              | `CopilotChatInput.vue`              | Textarea + send button + attachment button        |
| `CopilotChatAssistantMessage`   | `CopilotChatAssistantMessage.vue`   | Renders assistant message (Markdown)              |
| `CopilotChatUserMessage`        | `CopilotChatUserMessage.vue`        | Renders user message                              |
| `CopilotChatReasoningMessage`   | `CopilotChatReasoningMessage.vue`   | Renders chain-of-thought reasoning                |
| `CopilotChatMessageView`        | `CopilotChatMessageView.vue`        | Dispatcher — routes to correct message component  |
| `CopilotChatToolCallsView`      | `CopilotChatToolCallsView.vue`      | Renders tool call list in message                 |
| `CopilotChatSuggestionPill`     | `CopilotChatSuggestionPill.vue`     | Single suggestion chip                            |
| `CopilotChatSuggestionView`     | `CopilotChatSuggestionView.vue`     | Suggestion strip                                  |
| `CopilotChatToggleButton`       | `CopilotChatToggleButton.vue`       | Floating toggle button for sidebar/popup          |
| `CopilotModalHeader`            | `CopilotModalHeader.vue`            | Header with title + close button                  |
| `CopilotSidebarView`            | `CopilotSidebarView.vue`            | Sidebar layout shell                              |
| `CopilotPopupView`              | `CopilotPopupView.vue`              | Popup layout shell                                |
| `CopilotChatAudioRecorder`      | `CopilotChatAudioRecorder.vue`      | Voice input button                                |
| `CopilotChatAttachmentQueue`    | `CopilotChatAttachmentQueue.vue`    | Renders pending attachments                       |
| `CopilotChatAttachmentRenderer` | `CopilotChatAttachmentRenderer.vue` | Renders a single attachment thumbnail             |
| `WildcardToolCallRender`        | `WildcardToolCallRender.vue`        | Catch-all tool-call renderer                      |
| `CopilotKitInspector`           | `CopilotKitInspector.vue`           | Dev-mode inspector overlay                        |
| `MCPAppsActivityRenderer`       | `MCPAppsActivityRenderer.vue`       | Renders MCP app activity messages                 |

### 3.8 Generative UI (A2UI / Open Generative UI)

| React API                             | Vue equivalent                                                      | Notes                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `createA2UIMessageRenderer(options)`  | `createA2UIMessageRenderer(options)`                                | Factory fn; returns a message renderer component — needs Vue renderer bridge via `@a2ui/web_core` |
| `A2UITheme` / `a2uiDefaultTheme`      | pass-through re-exports                                             | Pure data/types                                                                                   |
| Open Generative UI (sandboxed iframe) | `OpenGenerativeUIRenderer.vue` + `OpenGenerativeUIToolRenderer.vue` | Sandboxed HTML/CSS/JS rendering using `@jetbrains/websandbox`                                     |

---

## 4. Dependency Analysis for Vue Package

### Direct reuse (no porting needed)

```
@copilotkit/core        — CopilotKitCore, agent registry, etc.
@copilotkit/shared      — types, utils
@ag-ui/client           — AbstractAgent, HttpAgent, events
@ag-ui/core             — capability types
@a2ui/web_core          — A2UI rendering logic (used by a2ui-renderer)
```

### Vue-specific additions needed

```
vue                     — framework peer dependency
@vueuse/core            — reactive utilities (useEventListener, useResizeObserver, etc.)
```

### Replaces React-specific deps

```
React Context     → Vue provide/inject
React hooks       → Vue composables (ref, computed, watch, watchEffect, onMounted, onUnmounted)
React.useState    → ref()
React.useReducer  → ref() + custom updater or useReducer composable
React.useMemo     → computed()
React.useEffect   → watchEffect() / watch()
React.useRef      → ref() with non-reactive semantic or shallowRef()
react-markdown    → vue-markdown-it or @vueup/vue-quill (TBD)
slate-react       → (for textarea) native Vue contenteditable approach
radix-ui          → Radix Vue (https://www.radix-vue.com/) — drop-in
lucide-react      → lucide-vue-next
@tanstack/react-virtual → @tanstack/vue-virtual
```

---

## 5. Implementation Complexity Assessment

| Area                                  | Effort | Risk   | Notes                                                                        |
| ------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------- |
| `CopilotKitProvider` Vue component    | Low    | Low    | Thin wrapper over `CopilotKitCore`; mostly prop → constructor mapping        |
| `useAgent` composable                 | Medium | Low    | React subscription pattern maps cleanly to `watchEffect` + `shallowRef`      |
| `useCopilotChat` composable           | Medium | Low    | Message array → `ref`, send/stop → plain async functions                     |
| Chat UI SFCs (Phase A)                | Medium | Low    | Pure UI work; Tailwind CSS carries over; Radix Vue replaces Radix UI         |
| Tool rendering hooks                  | Medium | Medium | Render prop pattern → Vue slot/render fn; needs careful lifecycle management |
| Generative UI / A2UI renderer         | High   | High   | `@a2ui/web_core` may have browser-only APIs; needs investigation             |
| Open Generative UI (sandboxed iframe) | High   | Medium | `@jetbrains/websandbox` is framework-agnostic; mostly wrapper work           |
| `CopilotChatAudioRecorder` / voice    | Medium | Medium | Browser MediaRecorder API is framework-agnostic; Vue wrapper straightforward |
| `react-textarea` equivalent           | High   | High   | Uses Slate.js with React bindings; need Vue-native rich-text approach        |

---

## 6. Recommended Package Structure

```
packages/vue/
├── package.json                   # copilotkit-vue — peer: vue ^3.4
├── tsconfig.json
├── tsdown.config.ts
├── src/
│   ├── index.ts                   # public barrel: re-exports core + shared types + all Vue APIs
│   ├── adapters/                  # ← thin adapter layer (upgrade-friendly)
│   │   ├── CopilotKitCoreAdapter.ts  # maps CopilotKitCore events to Vue reactivity
│   │   └── AgentAdapter.ts           # wraps AbstractAgent subscriptions as composables
│   ├── providers/
│   │   ├── CopilotKitProvider.vue
│   │   ├── CopilotChatConfigurationProvider.vue
│   │   └── keys.ts                   # InjectionKey constants
│   ├── composables/
│   │   ├── useAgent.ts
│   │   ├── useCopilotKit.ts
│   │   ├── useCopilotChat.ts
│   │   ├── useFrontendTool.ts
│   │   ├── useRenderTool.ts
│   │   ├── useHumanInTheLoop.ts
│   │   ├── useInterrupt.ts
│   │   ├── useCopilotReadable.ts
│   │   ├── useCopilotAction.ts
│   │   ├── useThreads.ts
│   │   ├── useAttachments.ts
│   │   ├── useSuggestions.ts
│   │   └── ... (mirrors hooks/ list above)
│   ├── components/
│   │   ├── chat/
│   │   │   ├── CopilotChat.vue
│   │   │   ├── CopilotSidebar.vue
│   │   │   ├── CopilotPopup.vue
│   │   │   ├── CopilotChatView.vue
│   │   │   ├── CopilotChatInput.vue
│   │   │   ├── CopilotChatMessageView.vue
│   │   │   ├── CopilotChatAssistantMessage.vue
│   │   │   ├── CopilotChatUserMessage.vue
│   │   │   ├── CopilotChatReasoningMessage.vue
│   │   │   ├── CopilotChatToolCallsView.vue
│   │   │   ├── CopilotChatSuggestionPill.vue
│   │   │   ├── CopilotChatSuggestionView.vue
│   │   │   ├── CopilotChatToggleButton.vue
│   │   │   ├── CopilotChatAudioRecorder.vue
│   │   │   ├── CopilotChatAttachmentQueue.vue
│   │   │   └── CopilotChatAttachmentRenderer.vue
│   │   ├── layout/
│   │   │   ├── CopilotModalHeader.vue
│   │   │   ├── CopilotSidebarView.vue
│   │   │   └── CopilotPopupView.vue
│   │   └── tools/
│   │       ├── WildcardToolCallRender.vue
│   │       └── MCPAppsActivityRenderer.vue
│   ├── a2ui/
│   │   ├── A2UIMessageRenderer.ts    # Vue port of createA2UIMessageRenderer
│   │   └── A2UIToolCallRenderer.vue
│   └── styles/
│       └── index.css                 # scoped Tailwind base styles
└── scripts/
    └── sync-react-exports.ts        # diffs react-core exports vs vue exports → reports gaps
```

---

## 7. Upgrade-Friendliness Design Rules

1. **Adapter isolation**: All `CopilotKitCore` → Vue reactivity bridging lives in `src/adapters/`. When core changes its subscription API, only adapters need updating.
2. **Type mirroring**: Import and re-export types directly from `@copilotkit/core` and `@copilotkit/shared` — never copy-paste them into the Vue package. Type-only imports are erased at build time.
3. **API name parity**: Composable and component names match React hook/component names 1:1. Arg shapes mirror React props (using same TypeScript interfaces where possible).
4. **`sync-react-exports.ts`**: Script diffs `packages/react-core` public exports against `packages/vue` exports and prints a missing-bindings report. Run after every upstream version bump.
5. **Version lockstep**: `packages/vue/package.json` pins `@copilotkit/core`, `@copilotkit/shared`, `@copilotkit/runtime-client-gql` to `workspace:*`. Vue package version tracks monorepo release.

---

## 8. Recommended Build Phases

| Phase       | Scope                                                                                                                  | Deliverable                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **MVP**     | `CopilotKitProvider`, `useAgent`, `useCopilotChat`, `useFrontendTool`, `useCopilotReadable`, headless Chat composables | Runnable agent + headless chat in Vue      |
| **Phase A** | All Chat SFCs (CopilotChat, Sidebar, Popup, messages, input, suggestions)                                              | Full styled chat UI matching React version |
| **Phase B** | Tool rendering, `useRenderTool`, `useHumanInTheLoop`, `useInterrupt`, A2UI renderer                                    | Generative UI + tool-rendered components   |
| **Phase C** | Attachment support, voice/audio recorder, threads, Open Generative UI (sandboxed iframe)                               | Feature parity                             |
| **Phase D** | `CopilotTextarea` Vue component, theming API, Storybook stories, full test suite                                       | Polish + parity                            |

Current status note:

- Phase B core composables and chat integration are implemented in `packages/vue/src` (`useRenderTool`, `useComponent`, `useHumanInTheLoop`, `useInterrupt`, custom tool rendering in chat).
- A2UI Phase B parity APIs are now present in Vue (`A2UIToolCallRenderer`, `createA2UIMessageRenderer`, `useRenderActivityMessage`, `useRenderCustomMessages`).
- Remaining parity work has shifted mostly to broader export surface alignment (component prop types and non-Phase-B symbols reported by `sync:report`).
