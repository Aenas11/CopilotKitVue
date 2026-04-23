import type { Message } from "@ag-ui/core";
import { useCopilotChatConfiguration } from "./useCopilotChatConfiguration";
import { useCopilotKit } from "./useCopilotKit";

export type CustomMessageRendererPosition = "before" | "after";

export interface CustomMessageRenderer {
    agentId?: string;
    render: ((props: {
        message: Message;
        position: CustomMessageRendererPosition;
        runId: string;
        messageIndex: number;
        messageIndexInRun: number;
        numberOfMessagesInRun: number;
        agentId: string;
        stateSnapshot: unknown;
    }) => unknown) | null;
}

interface UseRenderCustomMessagesParams {
    message: Message;
    position: CustomMessageRendererPosition;
}

/**
 * Vue parity hook for React's useRenderCustomMessages.
 * Returns a render function scoped to the active chat agent.
 */
export function useRenderCustomMessages() {
    const { copilotkit } = useCopilotKit();
    const config = useCopilotChatConfiguration();
    if (!config) return null;

    const agentId = config.agentId ?? "default";
    const threadId = config.threadId;

    const customMessageRenderers =
        (((copilotkit as unknown as { renderCustomMessages?: CustomMessageRenderer[] })
            .renderCustomMessages ?? [])
            .filter(
                (renderer) => renderer.agentId === undefined || renderer.agentId === agentId,
            )
            .sort((a, b) => {
                const aHasAgent = a.agentId !== undefined;
                const bHasAgent = b.agentId !== undefined;
                if (aHasAgent === bHasAgent) return 0;
                return aHasAgent ? -1 : 1;
            }));

    return function renderCustom(params: UseRenderCustomMessagesParams): unknown | null {
        if (!customMessageRenderers.length) return null;

        const { message, position } = params;
        const core = copilotkit as unknown as {
            getRunIdForMessage?: (agentId?: string, threadId?: string, messageId?: string) => string | undefined;
            getRunIdsForThread?: (agentId?: string, threadId?: string) => string[];
            getStateByRun?: (agentId?: string, threadId?: string, runId?: string) => unknown;
            getAgent?: (agentId?: string) => { messages?: Message[] } | undefined;
        };

        const resolvedRunId =
            core.getRunIdForMessage?.(agentId, threadId, message.id) ??
            core.getRunIdsForThread?.(agentId, threadId)?.slice(-1)[0];

        const runId = resolvedRunId ?? `missing-run-id:${message.id}`;
        const agent = core.getAgent?.(agentId);
        if (!agent) return null;

        const agentMessages = agent.messages ?? [];

        const messagesIdsInRun = resolvedRunId
            ? agentMessages
                .filter(
                    (msg) => core.getRunIdForMessage?.(agentId, threadId, msg.id) === resolvedRunId,
                )
                .map((msg) => msg.id)
            : [message.id];

        const rawMessageIndex = agentMessages.findIndex((msg) => msg.id === message.id);
        const messageIndex = rawMessageIndex >= 0 ? rawMessageIndex : 0;
        const messageIndexInRun = resolvedRunId
            ? Math.max(messagesIdsInRun.indexOf(message.id), 0)
            : 0;
        const numberOfMessagesInRun = resolvedRunId ? messagesIdsInRun.length : 1;
        const stateSnapshot = resolvedRunId
            ? core.getStateByRun?.(agentId, threadId, resolvedRunId)
            : undefined;

        for (const renderer of customMessageRenderers) {
            if (!renderer.render) continue;

            const result = renderer.render({
                message,
                position,
                runId,
                messageIndex,
                messageIndexInRun,
                numberOfMessagesInRun,
                agentId,
                stateSnapshot,
            });

            if (result != null) return result;
        }

        return null;
    };
}
