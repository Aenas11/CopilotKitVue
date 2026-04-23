import type { AbstractAgent } from "@ag-ui/client";
import type { ActivityMessage } from "@ag-ui/core";
import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
import { useCopilotChatConfiguration } from "./useCopilotChatConfiguration";
import { useCopilotKit } from "./useCopilotKit";

export interface SafeParseSuccess<T> {
    success: true;
    data: T;
}

export interface SafeParseFailure {
    success: false;
    error: unknown;
}

export interface SafeParseSchema<T> {
    safeParse: (value: unknown) => SafeParseSuccess<T> | SafeParseFailure;
}

export interface RenderActivityMessageProps<TActivityContent> {
    activityType: string;
    content: TActivityContent;
    message: ActivityMessage;
    agent: AbstractAgent | undefined;
}

export interface ActivityMessageRenderer<TActivityContent> {
    activityType: string;
    agentId?: string;
    content: SafeParseSchema<TActivityContent>;
    render: (props: RenderActivityMessageProps<TActivityContent>) => unknown;
}

/**
 * Vue parity hook for React's useRenderActivityMessage.
 * Resolves the matching activity renderer by activityType/agent and renders
 * the activity payload when the schema parse succeeds.
 */
export function useRenderActivityMessage() {
    const { copilotkit } = useCopilotKit();
    const config = useCopilotChatConfiguration();
    const agentId = config?.agentId ?? DEFAULT_AGENT_ID;

    const renderers =
        ((copilotkit as unknown as { renderActivityMessages?: ActivityMessageRenderer<unknown>[] })
            .renderActivityMessages ?? []);

    const findRenderer = (activityType: string): ActivityMessageRenderer<unknown> | null => {
        if (!renderers.length) return null;

        const matches = renderers.filter(
            (renderer) => renderer.activityType === activityType,
        );

        return (
            matches.find((candidate) => candidate.agentId === agentId) ??
            matches.find((candidate) => candidate.agentId === undefined) ??
            renderers.find((candidate) => candidate.activityType === "*") ??
            null
        );
    };

    const renderActivityMessage = (message: ActivityMessage): unknown | null => {
        const renderer = findRenderer(message.activityType);
        if (!renderer) return null;

        const parseResult = renderer.content.safeParse(message.content);
        if (!parseResult.success) {
            console.warn(
                `Failed to parse content for activity message '${message.activityType}':`,
                parseResult.error,
            );
            return null;
        }

        const registryAgent =
            (copilotkit as unknown as { getAgent?: (id: string) => AbstractAgent | undefined })
                .getAgent?.(agentId);

        return renderer.render({
            activityType: message.activityType,
            content: parseResult.data,
            message,
            agent: registryAgent,
        });
    };

    return { renderActivityMessage, findRenderer };
}
