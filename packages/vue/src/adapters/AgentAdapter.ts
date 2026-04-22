/**
 * AgentAdapter
 *
 * Wraps a per-agent subscription via `CopilotKitCore.subscribe` as Vue
 * reactive state. This is the single place where CopilotKitCore subscription
 * API is used directly for agent state bridging.
 *
 * When upstream changes the subscription callback shapes, update here only.
 */

import { shallowRef, triggerRef, type ShallowRef } from "vue";
import type { CopilotKitCore } from "@copilotkit/core";
import type { AbstractAgent, State, Message } from "@ag-ui/client";

export interface AgentAdapterState {
    /** The resolved agent instance for the subscribed agentId. */
    agent: ShallowRef<AbstractAgent | null>;
    /** Latest message array. */
    messages: ShallowRef<Message[]>;
    /** Latest agent state. */
    state: ShallowRef<State | null>;
    /** Whether a run is currently active. */
    isRunning: ShallowRef<boolean>;
    /** Unsubscribe and tear down the subscription. */
    dispose(): void;
}

export interface AgentAdapterOptions {
    agentId: string;
    threadId?: string;
}

/**
 * Creates a reactive bridge to a single agent subscription.
 * Call `dispose()` on `onUnmounted`.
 */
export function createAgentAdapter(
    copilotkit: CopilotKitCore,
    options: AgentAdapterOptions,
): AgentAdapterState {
    const agent = shallowRef<AbstractAgent | null>(null);
    const messages = shallowRef<Message[]>([]);
    const state = shallowRef<State | null>(null);
    const isRunning = shallowRef(false);

    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    function stopPolling() {
        if (pollingInterval != null) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    function syncFromAgent(a: AbstractAgent) {
        messages.value = [...(a.messages ?? [])];
        state.value = a.state ?? null;
        triggerRef(messages);
        triggerRef(state);
    }

    const outerSub = copilotkit.subscribe({
        onAgentsChanged() {
            const resolved = copilotkit.getAgent(options.agentId) ?? null;
            agent.value = resolved;
            triggerRef(agent);
            if (resolved) syncFromAgent(resolved);
        },
        onAgentRunStarted(event) {
            if (event.agent.agentId !== options.agentId && event.agent.agentId != null) return;
            isRunning.value = true;
            triggerRef(isRunning);
            agent.value = event.agent;
            triggerRef(agent);

            stopPolling();
            pollingInterval = setInterval(() => {
                if (!isRunning.value) { stopPolling(); return; }
                syncFromAgent(event.agent);
            }, 150);
        },
    });

    const initial = copilotkit.getAgent(options.agentId) ?? null;
    agent.value = initial;
    if (initial) syncFromAgent(initial);

    return {
        agent,
        messages,
        state,
        isRunning,
        dispose() {
            stopPolling();
            outerSub.unsubscribe();
        },
    };
}
