import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@ag-ui/client";
import { createAgentAdapter } from "./AgentAdapter";

type MockAgent = {
    agentId: string;
    messages: Message[];
    state: Record<string, unknown> | null;
};

type SubscribeHandlers = {
    onAgentsChanged?: () => void;
    onAgentRunStarted?: (event: { agent: MockAgent }) => void;
};

function makeAgent(agentId = "agent-1"): MockAgent {
    return {
        agentId,
        messages: [],
        state: null,
    };
}

describe("createAgentAdapter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    it("hydrates initial agent state and refreshes onAgentsChanged", () => {
        const current = makeAgent("agent-1");
        current.messages = [{ id: "m1", role: "assistant", content: "initial" } as Message];
        current.state = { phase: "idle" };

        const handlers: SubscribeHandlers = {};
        const unsubscribe = vi.fn();
        const getAgent = vi.fn(() => current);

        const core = {
            subscribe: vi.fn((h: SubscribeHandlers) => {
                Object.assign(handlers, h);
                return { unsubscribe };
            }),
            getAgent,
        };

        const adapter = createAgentAdapter(core as never, { agentId: "agent-1" });

        expect(adapter.agent.value).toBe(current);
        expect(adapter.messages.value).toEqual(current.messages);
        expect(adapter.state.value).toEqual(current.state);

        current.messages = [{ id: "m2", role: "assistant", content: "updated" } as Message];
        current.state = { phase: "updated" };
        handlers.onAgentsChanged?.();

        expect(adapter.messages.value).toEqual(current.messages);
        expect(adapter.state.value).toEqual(current.state);

        adapter.dispose();
        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("starts run polling for matching agent and syncs message changes", () => {
        const runAgent = makeAgent("agent-1");
        const handlers: SubscribeHandlers = {};

        const core = {
            subscribe: vi.fn((h: SubscribeHandlers) => {
                Object.assign(handlers, h);
                return { unsubscribe: vi.fn() };
            }),
            getAgent: vi.fn(() => null),
        };

        const adapter = createAgentAdapter(core as never, { agentId: "agent-1" });

        handlers.onAgentRunStarted?.({ agent: runAgent });
        expect(adapter.isRunning.value).toBe(true);
        expect(adapter.agent.value).toBe(runAgent);

        runAgent.messages = [{ id: "m3", role: "assistant", content: "during run" } as Message];
        runAgent.state = { phase: "running" };

        vi.advanceTimersByTime(160);

        expect(adapter.messages.value).toEqual(runAgent.messages);
        expect(adapter.state.value).toEqual(runAgent.state);
    });

    it("ignores run-start events for different agent ids", () => {
        const handlers: SubscribeHandlers = {};

        const core = {
            subscribe: vi.fn((h: SubscribeHandlers) => {
                Object.assign(handlers, h);
                return { unsubscribe: vi.fn() };
            }),
            getAgent: vi.fn(() => null),
        };

        const adapter = createAgentAdapter(core as never, { agentId: "agent-1" });
        const otherAgent = makeAgent("agent-2");

        handlers.onAgentRunStarted?.({ agent: otherAgent });

        expect(adapter.isRunning.value).toBe(false);
        expect(adapter.agent.value).toBeNull();
    });

    it("dispose stops polling and unsubscribes outer subscription", () => {
        const runAgent = makeAgent("agent-1");
        const handlers: SubscribeHandlers = {};
        const unsubscribe = vi.fn();

        const core = {
            subscribe: vi.fn((h: SubscribeHandlers) => {
                Object.assign(handlers, h);
                return { unsubscribe };
            }),
            getAgent: vi.fn(() => null),
        };

        const adapter = createAgentAdapter(core as never, { agentId: "agent-1" });
        handlers.onAgentRunStarted?.({ agent: runAgent });

        adapter.dispose();

        runAgent.messages = [{ id: "m4", role: "assistant", content: "should not sync" } as Message];
        vi.advanceTimersByTime(200);

        expect(adapter.messages.value).toEqual([]);
        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
});
