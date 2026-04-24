import type { InjectionKey } from "vue";
import type { CopilotKitCore } from "@copilotkit/core";

// ---------------------------------------------------------------------------
// CopilotKit root context
// ---------------------------------------------------------------------------

export interface CopilotKitContext {
    /** The underlying framework-agnostic core instance. */
    copilotkit: CopilotKitCore;
    /** Default threadId for child useAgent calls that don't specify their own. */
    threadId?: string;
    /** Provider-level default throttle for subscribeToAgentWithOptions. */
    defaultThrottleMs?: number;
}

export const CopilotKitKey: InjectionKey<CopilotKitContext> =
    Symbol("CopilotKit");

// ---------------------------------------------------------------------------
// Chat configuration context (scoped to a CopilotChat / CopilotSidebar etc.)
// ---------------------------------------------------------------------------

export interface CopilotChatConfiguration {
    threadId?: string;
    agentId?: string;
    labels?: {
        title?: string;
        initial?: string;
        placeholder?: string;
        chatInputToolbarStartTranscribeButtonLabel?: string;
        chatInputToolbarCancelTranscribeButtonLabel?: string;
        chatInputToolbarFinishTranscribeButtonLabel?: string;
        chatInputToolbarAddButtonLabel?: string;
        stopButtonTooltip?: string;
        regenerateResponseTooltip?: string;
        thinkingMessage?: string;
        modalHeaderTitle?: string;
    };
    /** Whether the sidebar/popup panel is currently open. */
    isModalOpen?: boolean;
    /** Setter to toggle the modal open state. */
    setModalOpen?: (open: boolean) => void;
}

export const CopilotChatConfigurationKey: InjectionKey<CopilotChatConfiguration> =
    Symbol("CopilotChatConfiguration");
