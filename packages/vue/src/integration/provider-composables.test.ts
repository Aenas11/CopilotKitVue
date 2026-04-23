import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import type { Message } from "@ag-ui/client";

const coreHoisted = vi.hoisted(() => {
    type Handlers = {
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

    class MockCopilotKitCore {
        public headers: Record<string, string>;
        public runtimeUrl: string | undefined;
        public runtimeTransport: unknown;
        public runtimeConnectionStatus = "Connected";
        private readonly agents = new Map<string, MockAgent>();
        private readonly handlers = new Set<Handlers>();

        constructor(config: {
            headers?: Record<string, string>;
            runtimeUrl?: string;
            transport?: unknown;
        }) {
            this.headers = config.headers ?? {};
            this.runtimeUrl = config.runtimeUrl;
            this.runtimeTransport = config.transport;
        }

        setHeaders(headers: Record<string, string>) {
            this.headers = headers;
        }

        setProperties() {
            // no-op for tests
        }

        getAgent(id: string) {
            return this.agents.get(id) ?? null;
        }

        subscribe(handlers: Handlers) {
            this.handlers.add(handlers);
            return {
                unsubscribe: () => {
                    this.handlers.delete(handlers);
                },
            };
        }

        __setAgent(id: string, agent: MockAgent) {
            this.agents.set(id, agent);
        }

        __emitAgentsChanged() {
            for (const h of this.handlers) {
                h.onAgentsChanged?.();
            }
        }
    }

    const runtimeStatus = {
        Disconnected: "Disconnected",
        Connecting: "Connecting",
        Error: "Error",
        Connected: "Connected",
    };

    return {
        MockCopilotKitCore,
        MockProxiedCopilotRuntimeAgent,
        runtimeStatus,
    };
});

vi.mock("@copilotkit/core", () => ({
    CopilotKitCore: coreHoisted.MockCopilotKitCore,
    ProxiedCopilotRuntimeAgent: coreHoisted.MockProxiedCopilotRuntimeAgent,
    CopilotKitCoreRuntimeConnectionStatus: coreHoisted.runtimeStatus,
}));

import CopilotKitProvider from "../providers/CopilotKitProvider.vue";
import { useCopilotKit } from "../composables/useCopilotKit";
import { useAgent } from "../composables/useAgent";

type IntegrationAgent = {
    agentId: string;
    messages: Message[];
    state: Record<string, unknown> | null;
    threadId?: string;
    subscribe: ReturnType<typeof vi.fn>;
    clone: ReturnType<typeof vi.fn>;
};

function createAgent(agentId = "test-agent"): IntegrationAgent {
    return {
        agentId,
        messages: [],
        state: null,
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        clone: vi.fn(function clone(this: IntegrationAgent) {
            return this;
        }),
    };
}

describe("provider + composables integration", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    it("throws when useCopilotKit is called outside provider", () => {
        const Consumer = defineComponent({
            setup() {
                useCopilotKit();
                return () => null;
            },
        });

        expect(() => mount(Consumer)).toThrowError(/must be called inside a <CopilotKitProvider>/);
    });

    it("hydrates useAgent from provider core and refreshes on core agent changes", async () => {
        const captured = {
            context: null as ReturnType<typeof useCopilotKit> | null,
            messages: null as ReturnType<typeof useAgent>["messages"] | null,
            state: null as ReturnType<typeof useAgent>["state"] | null,
            agent: null as ReturnType<typeof useAgent>["agent"] | null,
        };

        const Child = defineComponent({
            setup() {
                const context = useCopilotKit();
                const agentData = useAgent({
                    agentId: "integration-agent",
                    threadId: ref("provider-thread"),
                });
                captured.context = context;
                captured.messages = agentData.messages;
                captured.state = agentData.state;
                captured.agent = agentData.agent;
                return () => null;
            },
        });

        const Parent = defineComponent({
            setup() {
                return () =>
                    h(
                        CopilotKitProvider,
                        {
                            threadId: "provider-thread",
                            headers: { authorization: "Bearer token" },
                        },
                        {
                            default: () => h(Child),
                        },
                    );
            },
        });

        mount(Parent);

        expect(captured.context).toBeTruthy();
        expect(captured.context?.threadId).toBe("provider-thread");

        const core = captured.context?.copilotkit as unknown as {
            __setAgent: (id: string, agent: IntegrationAgent) => void;
            __emitAgentsChanged: () => void;
        };

        const mockAgent = createAgent("integration-agent");
        mockAgent.messages = [{ id: "m1", role: "assistant", content: "hello integration" } as Message];
        mockAgent.state = { phase: "ready" };

        core.__setAgent("integration-agent", mockAgent);
        core.__emitAgentsChanged();
        await nextTick();

        expect(captured.agent?.value).toBe(mockAgent);
        expect(captured.messages?.value).toEqual(mockAgent.messages);
        expect(captured.state?.value).toEqual(mockAgent.state);
    });
});
