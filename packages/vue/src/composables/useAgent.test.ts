import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";
import type { Message } from "@ag-ui/client";

const coreHoisted = vi.hoisted(() => {
    class MockProxiedCopilotRuntimeAgent {
        public headers: Record<string, string> = {};
        public threadId?: string;
        public messages: Message[] = [];
        public state: Record<string, unknown> | null = null;
        public agentId: string;

        constructor(config: { agentId: string }) {
            this.agentId = config.agentId;
        }

        subscribe() {
            return { unsubscribe: vi.fn() };
        }
    }

    return {
        MockProxiedCopilotRuntimeAgent,
        runtimeStatus: {
            Disconnected: "Disconnected",
            Connecting: "Connecting",
            Error: "Error",
            Connected: "Connected",
        },
    };
});

vi.mock("@copilotkit/core", () => ({
    ProxiedCopilotRuntimeAgent: coreHoisted.MockProxiedCopilotRuntimeAgent,
    CopilotKitCoreRuntimeConnectionStatus: coreHoisted.runtimeStatus,
}));

const mockUseCopilotKit = vi.fn();
const mockUseCopilotChatConfiguration = vi.fn(() => ({}));

vi.mock("./useCopilotKit", () => ({
    useCopilotKit: () => mockUseCopilotKit(),
}));

vi.mock("./useCopilotChatConfiguration", () => ({
    useCopilotChatConfiguration: () => mockUseCopilotChatConfiguration(),
}));

import { useAgent } from "./useAgent";
import {
    CopilotKitCoreRuntimeConnectionStatus,
    ProxiedCopilotRuntimeAgent,
} from "@copilotkit/core";

type SubscriptionHandlers = {
    onAgentsChanged?: () => void;
    onError?: (event: { context?: { agentId?: string } }) => void;
    onAgentRunStarted?: (event: { agent: MockAgent }) => void;
};

type MockAgent = {
    agentId: string;
    messages: Message[];
    state: Record<string, unknown> | null;
    threadId?: string;
    subscribe: ReturnType<typeof vi.fn>;
    clone: ReturnType<typeof vi.fn>;
};

function createMockAgent(agentId = "test-agent"): MockAgent {
    return {
        agentId,
        messages: [],
        state: null,
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        clone: vi.fn(function clone(this: MockAgent) {
            return this;
        }),
    };
}

function mountUseAgent(options: { agentId?: string; threadId?: string | ReturnType<typeof ref<string>> } = {}) {
    const holder: { value?: ReturnType<typeof useAgent> } = {};

    const TestComp = defineComponent({
        setup() {
            holder.value = useAgent(options);
            return () => null;
        },
    });

    const wrapper = mount(TestComp);
    if (!holder.value) {
        throw new Error("Failed to initialize composable");
    }

    return { wrapper, result: holder.value };
}

describe("useAgent", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockUseCopilotChatConfiguration.mockReturnValue({});
    });

    it("hydrates agent messages and state from existing core agent", () => {
        const existing = createMockAgent();
        existing.messages = [{ id: "m1", role: "assistant", content: "hello" } as Message];
        existing.state = { step: 1 };

        const coreSubUnsubscribe = vi.fn();
        const coreHandlers: SubscriptionHandlers = {};

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                getAgent: vi.fn(() => existing),
                subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                    Object.assign(coreHandlers, handlers);
                    return { unsubscribe: coreSubUnsubscribe };
                }),
                headers: {},
                runtimeUrl: undefined,
                runtimeTransport: undefined,
                runtimeConnectionStatus: "connected",
            },
            threadId: undefined,
        });

        const { result, wrapper } = mountUseAgent({ agentId: "test-agent" });

        expect(result.agent.value).toBe(existing);
        expect(result.messages.value).toEqual(existing.messages);
        expect(result.state.value).toEqual(existing.state);

        wrapper.unmount();
        expect(coreSubUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("tracks run lifecycle and cleans up run subscription on finish", () => {
        const existing = createMockAgent();
        const coreHandlers: SubscriptionHandlers = {};
        const coreSubUnsubscribe = vi.fn();
        const runSubUnsubscribe = vi.fn();
        let runHandlers: { onRunFinishedEvent?: () => void } | null = null;

        existing.subscribe = vi.fn((handlers: { onRunFinishedEvent?: () => void }) => {
            runHandlers = handlers;
            return { unsubscribe: runSubUnsubscribe };
        });

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                getAgent: vi.fn(() => existing),
                subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                    Object.assign(coreHandlers, handlers);
                    return { unsubscribe: coreSubUnsubscribe };
                }),
                headers: {},
                runtimeUrl: undefined,
                runtimeTransport: undefined,
                runtimeConnectionStatus: "connected",
            },
            threadId: undefined,
        });

        const { result, wrapper } = mountUseAgent({ agentId: "test-agent" });

        existing.messages = [{ id: "m2", role: "assistant", content: "running" } as Message];
        existing.state = { phase: "running" };

        coreHandlers.onAgentRunStarted?.({ agent: existing });

        expect(result.isRunning.value).toBe(true);
        expect(existing.subscribe).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(160);
        expect(result.messages.value).toEqual(existing.messages);

        (runHandlers as { onRunFinishedEvent?: () => void } | null)?.onRunFinishedEvent?.();

        expect(result.isRunning.value).toBe(false);
        expect(runSubUnsubscribe).toHaveBeenCalledTimes(1);

        wrapper.unmount();
        expect(coreSubUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("finalizes running state when core emits matching agent error", () => {
        const existing = createMockAgent();
        const coreHandlers: SubscriptionHandlers = {};
        const runSubUnsubscribe = vi.fn();

        existing.subscribe = vi.fn(() => ({ unsubscribe: runSubUnsubscribe }));

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                getAgent: vi.fn(() => existing),
                subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                    Object.assign(coreHandlers, handlers);
                    return { unsubscribe: vi.fn() };
                }),
                headers: {},
                runtimeUrl: undefined,
                runtimeTransport: undefined,
                runtimeConnectionStatus: "connected",
            },
            threadId: undefined,
        });

        const { result } = mountUseAgent({ agentId: "test-agent" });

        coreHandlers.onAgentRunStarted?.({ agent: existing });
        expect(result.isRunning.value).toBe(true);

        coreHandlers.onError?.({ context: { agentId: "test-agent" } });

        expect(result.isRunning.value).toBe(false);
        expect(runSubUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("cleans active run subscription on unmount", () => {
        const existing = createMockAgent();
        const coreHandlers: SubscriptionHandlers = {};
        const runSubUnsubscribe = vi.fn();

        existing.subscribe = vi.fn(() => ({ unsubscribe: runSubUnsubscribe }));

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                getAgent: vi.fn(() => existing),
                subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                    Object.assign(coreHandlers, handlers);
                    return { unsubscribe: vi.fn() };
                }),
                headers: {},
                runtimeUrl: undefined,
                runtimeTransport: undefined,
                runtimeConnectionStatus: "connected",
            },
            threadId: undefined,
        });

        const { wrapper, result } = mountUseAgent({ agentId: "test-agent" });
        coreHandlers.onAgentRunStarted?.({ agent: existing });
        expect(result.isRunning.value).toBe(true);

        wrapper.unmount();
        expect(runSubUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("creates provisional runtime agent when runtime is disconnected", () => {
        const coreHandlers: SubscriptionHandlers = {};
        const headers = { authorization: "Bearer token" };

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                getAgent: vi.fn(() => null),
                subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                    Object.assign(coreHandlers, handlers);
                    return { unsubscribe: vi.fn() };
                }),
                headers,
                runtimeUrl: "/api/copilotkit",
                runtimeTransport: undefined,
                runtimeConnectionStatus: CopilotKitCoreRuntimeConnectionStatus.Disconnected,
            },
            threadId: undefined,
        });

        const { result } = mountUseAgent({
            agentId: "runtime-agent",
            threadId: "thread-1",
        });

        expect(result.agent.value).toBeInstanceOf(ProxiedCopilotRuntimeAgent);
        expect((result.agent.value as ProxiedCopilotRuntimeAgent | null)?.threadId).toBe("thread-1");
        expect((result.agent.value as ProxiedCopilotRuntimeAgent | null)?.headers).toEqual(headers);
        expect(coreHandlers.onAgentsChanged).toBeDefined();
    });

    it("updates cached provisional agent headers and thread id on refresh", () => {
        const coreHandlers: SubscriptionHandlers = {};
        const dynamicThreadId = ref("thread-a");
        const core = {
            getAgent: vi.fn(() => null),
            subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                Object.assign(coreHandlers, handlers);
                return { unsubscribe: vi.fn() };
            }),
            headers: { authorization: "Bearer initial" },
            runtimeUrl: "/api/copilotkit",
            runtimeTransport: undefined,
            runtimeConnectionStatus: CopilotKitCoreRuntimeConnectionStatus.Disconnected,
        };

        mockUseCopilotKit.mockReturnValue({
            copilotkit: core,
            threadId: undefined,
        });

        const { result } = mountUseAgent({
            agentId: "runtime-agent",
            threadId: dynamicThreadId,
        });

        const first = result.agent.value as ProxiedCopilotRuntimeAgent;
        expect(first.threadId).toBe("thread-a");
        expect(first.headers).toEqual({ authorization: "Bearer initial" });

        dynamicThreadId.value = "thread-b";
        core.headers = { authorization: "Bearer updated" };
        coreHandlers.onAgentsChanged?.();

        const refreshed = result.agent.value as ProxiedCopilotRuntimeAgent;
        expect(refreshed).not.toBe(first);
        expect(refreshed.threadId).toBe("thread-b");
        expect(refreshed.headers).toEqual({ authorization: "Bearer updated" });
    });

    it("reuses thread-scoped cloned agent from cache", () => {
        const existing = createMockAgent("threaded-agent");
        const cloned = createMockAgent("threaded-agent");
        const coreHandlers: SubscriptionHandlers = {};

        existing.clone = vi.fn(() => cloned);

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                getAgent: vi.fn(() => existing),
                subscribe: vi.fn((handlers: SubscriptionHandlers) => {
                    Object.assign(coreHandlers, handlers);
                    return { unsubscribe: vi.fn() };
                }),
                headers: {},
                runtimeUrl: undefined,
                runtimeTransport: undefined,
                runtimeConnectionStatus: CopilotKitCoreRuntimeConnectionStatus.Connected,
            },
            threadId: undefined,
        });

        const { result } = mountUseAgent({
            agentId: "threaded-agent",
            threadId: "thread-1",
        });

        const firstResolved = result.agent.value;
        coreHandlers.onAgentsChanged?.();
        const secondResolved = result.agent.value;

        expect(existing.clone).toHaveBeenCalledTimes(1);
        expect(firstResolved).toBe(cloned);
        expect(secondResolved).toBe(firstResolved);
        expect((secondResolved as MockAgent | null)?.threadId).toBe("thread-1");
    });
});
