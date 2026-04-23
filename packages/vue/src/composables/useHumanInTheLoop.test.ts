import type { AgentSubscriber } from "@ag-ui/client";
import { defineComponent, nextTick, shallowRef } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VueWrapper } from "@vue/test-utils";
import { useHumanInTheLoop } from "./useHumanInTheLoop";

// ── Shared mocks ────────────────────────────────────────────────────────────

const mockRunAgent = vi.fn();
const mockStopAgent = vi.fn();
const mockUnsubscribe = vi.fn();

// The agent ref returned by the mocked useAgent — shared & reset between tests.
const mockAgentRef = shallowRef<Record<string, unknown> | null>(null);

vi.mock("./useCopilotKit", () => ({
    useCopilotKit: () => ({
        copilotkit: {
            runAgent: mockRunAgent,
            stopAgent: mockStopAgent,
            properties: {},
        },
    }),
}));

vi.mock("./useAgent", () => ({
    useAgent: () => ({
        agent: mockAgentRef,
        messages: shallowRef([]),
        state: shallowRef(null),
        isRunning: shallowRef(false),
    }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Mounts a probe component that calls `useHumanInTheLoop` and captures the return. */
function mountProbe(options = {}) {
    let result: ReturnType<typeof useHumanInTheLoop> | undefined;

    const Probe = defineComponent({
        setup() {
            result = useHumanInTheLoop(options);
            return () => null;
        },
    });

    const wrapper = mount(Probe);
    return { wrapper, get result() { return result!; } };
}

/** Build a mock agent that captures the subscriber passed to `subscribe()`. */
function makeMockAgent() {
    let capturedSubscriber: AgentSubscriber | null = null;

    const agent = {
        state: {},
        setState: vi.fn(),
        subscribe: vi.fn((sub: AgentSubscriber) => {
            capturedSubscriber = sub;
            return { unsubscribe: mockUnsubscribe };
        }),
    };

    function fireCustomEvent(name: string, value: unknown) {
        capturedSubscriber?.onCustomEvent?.({ event: { name, value } } as any);
    }

    return { agent, fireCustomEvent };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useHumanInTheLoop", () => {
    let currentWrapper: VueWrapper | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAgentRef.value = null;
        currentWrapper = null;
    });

    afterEach(() => {
        currentWrapper?.unmount();
        currentWrapper = null;
    });

    it("starts with isPending false and no interrupt value", () => {
        const { result, wrapper } = mountProbe();
        currentWrapper = wrapper;
        expect(result.isPending.value).toBe(false);
        expect(result.interruptValue.value).toBeUndefined();
    });

    it("sets isPending and interruptValue when LangGraphInterruptEvent is received", async () => {
        const { result, wrapper } = mountProbe();
        currentWrapper = wrapper;
        const { agent, fireCustomEvent } = makeMockAgent();

        mockAgentRef.value = agent as any;
        await nextTick();

        expect(agent.subscribe).toHaveBeenCalledOnce();

        fireCustomEvent("LangGraphInterruptEvent", "Should we deploy to production?");

        expect(result.isPending.value).toBe(true);
        expect(result.interruptValue.value).toBe("Should we deploy to production?");
    });

    it("ignores unrelated custom events", async () => {
        const { result, wrapper } = mountProbe();
        currentWrapper = wrapper;
        const { agent, fireCustomEvent } = makeMockAgent();

        mockAgentRef.value = agent as any;
        await nextTick();

        fireCustomEvent("SomeOtherEvent", "irrelevant");

        expect(result.isPending.value).toBe(false);
        expect(result.interruptValue.value).toBeUndefined();
    });

    it("resolve clears interrupt, updates agent state, and calls runAgent", async () => {
        const { result, wrapper } = mountProbe();
        currentWrapper = wrapper;
        const { agent, fireCustomEvent } = makeMockAgent();

        mockAgentRef.value = agent as any;
        await nextTick();

        fireCustomEvent("LangGraphInterruptEvent", "Confirm?");
        expect(result.isPending.value).toBe(true);

        result.resolve("yes");

        expect(result.isPending.value).toBe(false);
        expect(result.interruptValue.value).toBeUndefined();
        expect(agent.setState).toHaveBeenCalledWith(
            expect.objectContaining({ __copilotkit_interrupt_response: "yes" }),
        );
        expect(mockRunAgent).toHaveBeenCalledOnce();
    });

    it("resolve is a no-op when nothing is pending", async () => {
        const { result, wrapper } = mountProbe();
        currentWrapper = wrapper;
        const { agent } = makeMockAgent();

        mockAgentRef.value = agent as any;
        await nextTick();

        result.resolve("answer");

        expect(agent.setState).not.toHaveBeenCalled();
        expect(mockRunAgent).not.toHaveBeenCalled();
    });

    it("reject clears interrupt and calls stopAgent", async () => {
        const { result, wrapper } = mountProbe();
        currentWrapper = wrapper;
        const { agent, fireCustomEvent } = makeMockAgent();

        mockAgentRef.value = agent as any;
        await nextTick();

        fireCustomEvent("LangGraphInterruptEvent", "Confirm delete?");
        expect(result.isPending.value).toBe(true);

        result.reject("user cancelled");

        expect(result.isPending.value).toBe(false);
        expect(mockStopAgent).toHaveBeenCalledOnce();
    });

    it("unsubscribes from agent on unmount", async () => {
        const { wrapper } = mountProbe();
        // do NOT assign to currentWrapper — we unmount manually in this test
        const { agent } = makeMockAgent();

        mockAgentRef.value = agent as any;
        await nextTick();

        expect(mockUnsubscribe).not.toHaveBeenCalled();

        wrapper.unmount();

        expect(mockUnsubscribe).toHaveBeenCalledOnce();
    });

    it("unsubscribes from previous agent when agent changes", async () => {
        const { wrapper } = mountProbe();
        currentWrapper = wrapper;
        const { agent: agentA } = makeMockAgent();
        const { agent: agentB } = makeMockAgent();

        mockAgentRef.value = agentA as any;
        await nextTick();

        mockAgentRef.value = agentB as any;
        await nextTick();

        // unsubscribed from A after B was set
        expect(mockUnsubscribe).toHaveBeenCalledOnce();
        // subscribed to B
        expect(agentB.subscribe).toHaveBeenCalledOnce();
    });
});
