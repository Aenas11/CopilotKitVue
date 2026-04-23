/**
 * copilotkit-vue — public barrel export
 *
 * Import everything from this single entry point:
 *   import { CopilotKitProvider, useAgent, CopilotChat } from 'copilotkit-vue'
 *
 * Type-only re-exports from @copilotkit/core and @copilotkit/shared are
 * included so consumers don't need to add those as direct dependencies.
 */

import _CopilotKitProvider from "./providers/CopilotKitProvider.vue";
import _CopilotChatConfigurationProvider from "./providers/CopilotChatConfigurationProvider.vue";
import _CopilotChat from "./components/chat/CopilotChat.vue";
import _CopilotSidebar from "./components/chat/CopilotSidebar.vue";
import _CopilotPopup from "./components/chat/CopilotPopup.vue";
import _CopilotChatView from "./components/chat/CopilotChatView.vue";
import _CopilotChatInput from "./components/chat/CopilotChatInput.vue";
import _CopilotChatMessageView from "./components/chat/CopilotChatMessageView.vue";
import _CopilotChatAssistantMessage from "./components/chat/CopilotChatAssistantMessage.vue";
import _CopilotChatUserMessage from "./components/chat/CopilotChatUserMessage.vue";
import _CopilotChatReasoningMessage from "./components/chat/CopilotChatReasoningMessage.vue";
import _CopilotChatToolCallsView from "./components/chat/CopilotChatToolCallsView.vue";
import _CopilotChatSuggestionPill from "./components/chat/CopilotChatSuggestionPill.vue";
import _CopilotChatSuggestionView from "./components/chat/CopilotChatSuggestionView.vue";
import _CopilotChatToggleButton from "./components/chat/CopilotChatToggleButton.vue";
import _CopilotChatAudioRecorder from "./components/chat/CopilotChatAudioRecorder.vue";
import _CopilotChatAttachmentQueue from "./components/chat/CopilotChatAttachmentQueue.vue";
import _CopilotChatAttachmentRenderer from "./components/chat/CopilotChatAttachmentRenderer.vue";
import _CopilotModalHeader from "./components/layout/CopilotModalHeader.vue";
import _CopilotSidebarView from "./components/layout/CopilotSidebarView.vue";
import _CopilotPopupView from "./components/layout/CopilotPopupView.vue";
import { useSuggestions } from "./composables/useSuggestions";

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
export type CopilotKitContextValue = import("./providers/keys").CopilotKitContext;
export type CopilotChatConfigurationValue = import("./providers/keys").CopilotChatConfiguration;
export type CopilotChatLabels = NonNullable<import("./providers/keys").CopilotChatConfiguration["labels"]>;

// ---------------------------------------------------------------------------
// Providers (Vue components used as root wrappers)
// ---------------------------------------------------------------------------
export const CopilotKitProvider = _CopilotKitProvider;
export const CopilotChatConfigurationProvider = _CopilotChatConfigurationProvider;
export const CopilotKit = CopilotKitProvider;

type PropsOf<T> = T extends new (...args: any[]) => { $props: infer P } ? P : never;
export type CopilotKitProviderProps = PropsOf<typeof CopilotKitProvider>;
export type CopilotChatConfigurationProviderProps = PropsOf<typeof CopilotChatConfigurationProvider>;

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
export const useConfigureSuggestions = useSuggestions;

// ---------------------------------------------------------------------------
// Composables — tool rendering (Phase B)
// ---------------------------------------------------------------------------
export {
  useRenderTool,
  useRenderToolCall,
  useDefaultRenderTool,
} from "./composables/useRenderTool";
export { useRenderActivityMessage } from "./composables/useRenderActivityMessage";
export {
  useRenderCustomMessages,
  type CustomMessageRenderer,
  type CustomMessageRendererPosition,
} from "./composables/useRenderCustomMessages";
export { useHumanInTheLoop } from "./composables/useHumanInTheLoop";
export type { UseHumanInTheLoopReturn } from "./composables/useHumanInTheLoop";
export { useInterrupt, useLangGraphInterrupt } from "./composables/useInterrupt";
export { useComponent } from "./composables/useComponent";
export {
  createA2UIMessageRenderer,
  A2UI_OPERATIONS_KEY,
  type A2UIMessageRendererOptions,
} from "./a2ui/createA2UIMessageRenderer";

// ---------------------------------------------------------------------------
// Composables — threads & attachments (Phase B/C)
// ---------------------------------------------------------------------------
export { useThreads } from "./composables/useThreads";
export type { Thread, UseThreadsOptions, UseThreadsReturn } from "./composables/useThreads";
export { useAttachments } from "./composables/useAttachments";
export type { Attachment, UseAttachmentsReturn } from "./composables/useAttachments";

// ---------------------------------------------------------------------------
// Chat UI components
// ---------------------------------------------------------------------------
export const CopilotChat = _CopilotChat;
export const CopilotSidebar = _CopilotSidebar;
export const CopilotPopup = _CopilotPopup;
export const CopilotChatView = _CopilotChatView;
export const CopilotChatInput = _CopilotChatInput;
export const CopilotChatMessageView = _CopilotChatMessageView;
export const CopilotChatAssistantMessage = _CopilotChatAssistantMessage;
export const CopilotChatUserMessage = _CopilotChatUserMessage;
export const CopilotChatReasoningMessage = _CopilotChatReasoningMessage;
export const CopilotChatToolCallsView = _CopilotChatToolCallsView;
export const CopilotChatSuggestionPill = _CopilotChatSuggestionPill;
export const CopilotChatSuggestionView = _CopilotChatSuggestionView;
export const CopilotChatToggleButton = _CopilotChatToggleButton;
export const CopilotChatAudioRecorder = _CopilotChatAudioRecorder;
export const CopilotChatAttachmentQueue = _CopilotChatAttachmentQueue;
export const CopilotChatAttachmentRenderer = _CopilotChatAttachmentRenderer;

export type CopilotChatProps = PropsOf<typeof CopilotChat>;
export type CopilotSidebarProps = PropsOf<typeof CopilotSidebar>;
export type CopilotPopupProps = PropsOf<typeof CopilotPopup>;
export type CopilotChatViewProps = PropsOf<typeof CopilotChatView>;
export type CopilotChatInputProps = PropsOf<typeof CopilotChatInput>;
export type CopilotChatMessageViewProps = PropsOf<typeof CopilotChatMessageView>;
export type CopilotChatAssistantMessageProps = PropsOf<typeof CopilotChatAssistantMessage>;
export type CopilotChatUserMessageProps = PropsOf<typeof CopilotChatUserMessage>;
export type CopilotChatReasoningMessageProps = PropsOf<typeof CopilotChatReasoningMessage>;
export type CopilotChatToolCallsViewProps = PropsOf<typeof CopilotChatToolCallsView>;
export type CopilotChatSuggestionPillProps = PropsOf<typeof CopilotChatSuggestionPill>;
export type CopilotChatSuggestionViewProps = PropsOf<typeof CopilotChatSuggestionView>;
export type CopilotChatToggleButtonProps = PropsOf<typeof CopilotChatToggleButton>;

export const CopilotChatToggleButtonOpenIcon = CopilotChatToggleButton;
export const CopilotChatToggleButtonCloseIcon = CopilotChatToggleButton;

export type AudioRecorderState = "idle" | "recording" | "processing" | "error";
export interface AudioRecorderError {
  message: string;
  cause?: unknown;
}

// ---------------------------------------------------------------------------
// Layout components
// ---------------------------------------------------------------------------
export const CopilotModalHeader = _CopilotModalHeader;
export const CopilotSidebarView = _CopilotSidebarView;
export const CopilotPopupView = _CopilotPopupView;

export type CopilotModalHeaderProps = PropsOf<typeof CopilotModalHeader>;
export type CopilotSidebarViewProps = PropsOf<typeof CopilotSidebarView>;
export type CopilotPopupViewProps = PropsOf<typeof CopilotPopupView>;

// ---------------------------------------------------------------------------
// Tool components
// ---------------------------------------------------------------------------
export { default as A2UIToolCallRenderer } from "./components/tools/A2UIToolCallRenderer.vue";
export { default as WildcardToolCallRender } from "./components/tools/WildcardToolCallRender.vue";
export { default as MCPAppsActivityRenderer } from "./components/tools/MCPAppsActivityRenderer.vue";

export interface ToolsMenuItem {
  id?: string;
  label: string;
  icon?: unknown;
  onSelect?: () => void;
}

export const defaultTheme = {};

export const SandboxFunctionsContext = Symbol("SandboxFunctionsContext");

export function useSandboxFunctions(): Array<{ name: string; handler: (...args: unknown[]) => unknown }> {
  return [];
}
