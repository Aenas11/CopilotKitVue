import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, shallowRef } from "vue";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import type { AgentSubscriber } from "@ag-ui/client";
import { useInterrupt, useLangGraphInterrupt } from "./useInterrupt";

const mockRunAgent = vi.fn();
const mockStopAgent = vi.fn();
const mockAgentRef = shallowRef<Record<string, unknown> | null>(null);
const mockChatConfig = vi.fn(() => ({}));
const mockUseAgent = vi.fn((_options?: unknown) => ({
    agent: mockAgentRef,
    messages: shallowRef([]),
    state: shallowRef(null),
    isRunning: shallowRef(false),
}));

vi.mock("./useCopilotKit", () => ({
    useCopilotKit: () => ({
        copilotkit: {
            runAgent: mockRunAgent,
            stopAgent: mockStopAgent,
            properties: { source: "test" },
        },
    }),
}));

vi.mock("./useAgent", () => ({
    useAgent: (options?: unknown) => mockUseAgent(options),
}));

vi.mock("./useCopilotChatConfiguration", () => ({
    useCopilotChatConfiguration: () => mockChatConfig(),
}));

function mountProbe<T>(factory: () => T) {
    let result: T | undefined;

    const Probe = defineComponent({
        setup() {
            result = factory();
            return () => null;
        },
    });

    const wrapper = mount(Probe);
    return {
        wrapper,
        get result() {
            return result!;
        },
    };
}

function makeMockAgent() {
    let capturedSubscriber: AgentSubscriber | null = null;
    const unsubscribeSpy = vi.fn();

    const agent = {
        state: {},
        subscribe: vi.fn((subscriber: AgentSubscriber) => {
            capturedSubscriber = subscriber;
            return { unsubscribe: unsubscribeSpy };
        }),
    };

    function emitCustomEvent(name: string, value: unknown) {
        capturedSubscriber?.onCustomEvent?.({ event: { name, value } } as never);
    }

    function emitRunFinalized() {
        capturedSubscriber?.onRunFinalized?.({} as never);
    }

    function emitRunStarted() {
        capturedSubscriber?.onRunStartedEvent?.({} as never);
    }

    function emitRunFailed() {
        capturedSubscriber?.onRunFailed?.({} as never);
    }

    return {
        agent,
        emitCustomEvent,
        emitRunFailed,
        emitRunFinalized,
        emitRunStarted,
        unsubscribeSpy,
    };
}

describe("useInterrupt", () => {
    let currentWrapper: VueWrapper | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAgentRef.value = null;
        mockChatConfig.mockReturnValue({});
        currentWrapper = null;
    });

    afterEach(() => {
        currentWrapper?.unmount();
        currentWrapper = null;
    });

    it("starts idle with no event or result", () => {
        const { result, wrapper } = mountProbe(() => useInterrupt());
        currentWrapper = wrapper;

        expect(result.isPending.value).toBe(false);
        expect(result.event.value).toBeNull();
        expect(result.result.value).toBeNull();
    });

    it("surfaces interrupt only after run finalizes", async () => {
        const { result, wrapper } = mountProbe(() => useInterrupt<string>());
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "approve-me");
        expect(result.isPending.value).toBe(false);
        expect(result.event.value).toBeNull();

        emitRunFinalized();

        expect(result.isPending.value).toBe(true);
        expect(result.event.value).toEqual({ name: "on_interrupt", value: "approve-me" });
    });

    it("clears pending interrupt when a new run starts", async () => {
        const { result, wrapper } = mountProbe(() => useInterrupt<string>());
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized, emitRunStarted } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "first");
        emitRunFinalized();
        expect(result.isPending.value).toBe(true);

        emitRunStarted();

        expect(result.isPending.value).toBe(false);
        expect(result.event.value).toBeNull();
        expect(result.result.value).toBeNull();
    });

    it("resolve clears state and resumes the agent with interrupt payload", async () => {
        const { result, wrapper } = mountProbe(() => useInterrupt<string>());
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "approve-me");
        emitRunFinalized();

        result.resolve({ approved: true });

        expect(result.isPending.value).toBe(false);
        expect(result.event.value).toBeNull();
        expect(mockRunAgent).toHaveBeenCalledOnce();
        expect(mockRunAgent).toHaveBeenCalledWith({
            agent,
            forwardedProps: {
                source: "test",
                command: {
                    interruptEvent: "approve-me",
                    resume: { approved: true },
                },
            },
        });
    });

    it("reject clears state and stops the agent", async () => {
        const { result, wrapper } = mountProbe(() => useInterrupt<string>());
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "reject-me");
        emitRunFinalized();

        result.reject("nope");

        expect(result.isPending.value).toBe(false);
        expect(result.event.value).toBeNull();
        expect(mockStopAgent).toHaveBeenCalledWith({ agent });
    });

    it("skips pending state and handler when enabled returns false", async () => {
        const handler = vi.fn(() => "should-not-run");
        const { result, wrapper } = mountProbe(() =>
            useInterrupt<string, string>({
                enabled: () => false,
                handler,
            }),
        );
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "blocked");
        emitRunFinalized();

        expect(result.isPending.value).toBe(false);
        expect(result.event.value).toBeNull();
        expect(handler).not.toHaveBeenCalled();
    });

    it("stores sync handler result for the pending interrupt", async () => {
        const { result, wrapper } = mountProbe(() =>
            useInterrupt<string, string>({
                handler: ({ event }) => `handled:${event.value}`,
            }),
        );
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "sync");
        emitRunFinalized();

        expect(result.isPending.value).toBe(true);
        expect(result.result.value).toBe("handled:sync");
    });

    it("stores async handler result for the pending interrupt", async () => {
        const { result, wrapper } = mountProbe(() =>
            useInterrupt<string, string>({
                handler: ({ event }) => Promise.resolve(`async:${event.value}`),
            }),
        );
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        emitCustomEvent("on_interrupt", "later");
        emitRunFinalized();
        await Promise.resolve();
        await Promise.resolve();

        expect(result.isPending.value).toBe(true);
        expect(result.result.value).toBe("async:later");
    });

    it("unsubscribes on unmount", async () => {
        const { wrapper } = mountProbe(() => useInterrupt());
        const { agent, unsubscribeSpy } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        wrapper.unmount();

        expect(unsubscribeSpy).toHaveBeenCalledOnce();
    });
});

describe("useLangGraphInterrupt", () => {
    let currentWrapper: VueWrapper | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAgentRef.value = null;
        mockChatConfig.mockReturnValue({ agentId: "chat-agent" });
        currentWrapper = null;
    });

    afterEach(() => {
        currentWrapper?.unmount();
        currentWrapper = null;
    });

    it("uses chat-config agent id fallback and parses string payloads", async () => {
        const { result, wrapper } = mountProbe(() => useLangGraphInterrupt<{ approved: boolean }>());
        currentWrapper = wrapper;
        const { agent, emitCustomEvent, emitRunFinalized } = makeMockAgent();

        mockAgentRef.value = agent as never;
        await nextTick();

        expect(mockUseAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: "chat-agent" }));

        emitCustomEvent("on_interrupt", '{"approved":true}');
        emitRunFinalized();

        expect(result.isPending.value).toBe(true);
        expect(result.event.value).toEqual({
            name: "LangGraphInterruptEvent",
            value: { approved: true },
        });
    });
});
