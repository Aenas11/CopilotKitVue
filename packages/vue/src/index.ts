/**
 * copilotkit-vue — public barrel export
 *
 * Import everything from this single entry point:
 *   import { CopilotKitProvider, useAgent, CopilotChat } from 'copilotkit-vue'
 *
 * Type-only re-exports from @copilotkit/core and @copilotkit/shared are
 * included so consumers don't need to add those as direct dependencies.
 */

// ---------------------------------------------------------------------------
// Framework-agnostic re-exports (types only — tree-shaken at build time)
// ---------------------------------------------------------------------------
export type {
  CopilotKitCoreConfig,
  FrontendTool,
  Suggestion,
  SuggestionsConfig,
  CopilotRuntimeTransport,
} from "@copilotkit/core";
export { CopilotKitCoreRuntimeConnectionStatus } from "@copilotkit/core";
export type { Message } from "@ag-ui/client";
export type { AbstractAgent, State } from "@ag-ui/client";

// ---------------------------------------------------------------------------
// Injection keys & context types
// ---------------------------------------------------------------------------
export {
  CopilotKitKey,
  CopilotChatConfigurationKey,
} from "./providers/keys";
export type {
  CopilotKitContext,
  CopilotChatConfiguration,
} from "./providers/keys";

// ---------------------------------------------------------------------------
// Providers (Vue components used as root wrappers)
// ---------------------------------------------------------------------------
export { default as CopilotKitProvider } from "./providers/CopilotKitProvider.vue";
export { default as CopilotChatConfigurationProvider } from "./providers/CopilotChatConfigurationProvider.vue";

// ---------------------------------------------------------------------------
// Composables — MVP
// ---------------------------------------------------------------------------
export { useCopilotKit } from "./composables/useCopilotKit";
export { useCopilotChatConfiguration } from "./composables/useCopilotChatConfiguration";
export { useAgent, UseAgentUpdate } from "./composables/useAgent";
export type { UseAgentOptions, UseAgentReturn } from "./composables/useAgent";
export { useCopilotChat } from "./composables/useCopilotChat";
export type {
  UseCopilotChatOptions,
  UseCopilotChatReturn,
} from "./composables/useCopilotChat";
export { useFrontendTool } from "./composables/useFrontendTool";
export { useCopilotReadable } from "./composables/useCopilotReadable";
export type { UseCopilotReadableOptions } from "./composables/useCopilotReadable";
export { useCopilotAction } from "./composables/useCopilotAction";
export type { UseCopilotActionOptions } from "./composables/useCopilotAction";

// ---------------------------------------------------------------------------
// Composables — agent context & legacy
// ---------------------------------------------------------------------------
export { useCoAgent } from "./composables/useCoAgent";
export type { UseCoAgentOptions } from "./composables/useCoAgent";
export { useAgentContext } from "./composables/useAgentContext";
export { useCapabilities } from "./composables/useCapabilities";
export type { UseCapabilitiesReturn } from "./composables/useCapabilities";

// ---------------------------------------------------------------------------
// Composables — chat extras
// ---------------------------------------------------------------------------
export { useSuggestions } from "./composables/useSuggestions";
export type { UseSuggestionsReturn } from "./composables/useSuggestions";
export { useCopilotAdditionalInstructions } from "./composables/useCopilotAdditionalInstructions";

// ---------------------------------------------------------------------------
// Composables — tool rendering (Phase B stubs)
// ---------------------------------------------------------------------------
export {
  useRenderTool,
  useRenderToolCall,
  useDefaultRenderTool,
} from "./composables/useRenderTool";
export { useHumanInTheLoop } from "./composables/useHumanInTheLoop";
export type { UseHumanInTheLoopReturn } from "./composables/useHumanInTheLoop";
export { useInterrupt, useLangGraphInterrupt } from "./composables/useInterrupt";
export { useComponent } from "./composables/useComponent";

// ---------------------------------------------------------------------------
// Composables — threads & attachments (Phase B/C stubs)
// ---------------------------------------------------------------------------
export { useThreads } from "./composables/useThreads";
export type { Thread, UseThreadsOptions, UseThreadsReturn } from "./composables/useThreads";
export { useAttachments } from "./composables/useAttachments";
export type { Attachment, UseAttachmentsReturn } from "./composables/useAttachments";

// ---------------------------------------------------------------------------
// Chat UI components — MVP layout shell + stubs
// ---------------------------------------------------------------------------
export { default as CopilotChat } from "./components/chat/CopilotChat.vue";
export { default as CopilotSidebar } from "./components/chat/CopilotSidebar.vue";
export { default as CopilotPopup } from "./components/chat/CopilotPopup.vue";
export { default as CopilotChatView } from "./components/chat/CopilotChatView.vue";
export { default as CopilotChatInput } from "./components/chat/CopilotChatInput.vue";
export { default as CopilotChatMessageView } from "./components/chat/CopilotChatMessageView.vue";
export { default as CopilotChatAssistantMessage } from "./components/chat/CopilotChatAssistantMessage.vue";
export { default as CopilotChatUserMessage } from "./components/chat/CopilotChatUserMessage.vue";
export { default as CopilotChatReasoningMessage } from "./components/chat/CopilotChatReasoningMessage.vue";
export { default as CopilotChatToolCallsView } from "./components/chat/CopilotChatToolCallsView.vue";
export { default as CopilotChatSuggestionPill } from "./components/chat/CopilotChatSuggestionPill.vue";
export { default as CopilotChatSuggestionView } from "./components/chat/CopilotChatSuggestionView.vue";
export { default as CopilotChatToggleButton } from "./components/chat/CopilotChatToggleButton.vue";
export { default as CopilotChatAudioRecorder } from "./components/chat/CopilotChatAudioRecorder.vue";
export { default as CopilotChatAttachmentQueue } from "./components/chat/CopilotChatAttachmentQueue.vue";
export { default as CopilotChatAttachmentRenderer } from "./components/chat/CopilotChatAttachmentRenderer.vue";

// ---------------------------------------------------------------------------
// Layout components
// ---------------------------------------------------------------------------
export { default as CopilotModalHeader } from "./components/layout/CopilotModalHeader.vue";
export { default as CopilotSidebarView } from "./components/layout/CopilotSidebarView.vue";
export { default as CopilotPopupView } from "./components/layout/CopilotPopupView.vue";

// ---------------------------------------------------------------------------
// Tool components (Phase B stubs)
// ---------------------------------------------------------------------------
export { default as WildcardToolCallRender } from "./components/tools/WildcardToolCallRender.vue";
export { default as MCPAppsActivityRenderer } from "./components/tools/MCPAppsActivityRenderer.vue";
