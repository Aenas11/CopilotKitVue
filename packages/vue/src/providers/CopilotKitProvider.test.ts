import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, inject, nextTick } from "vue";
import { mount } from "@vue/test-utils";

const hoisted = vi.hoisted(() => {
    const coreInstances: Array<{
        setHeaders: ReturnType<typeof vi.fn>;
        setProperties: ReturnType<typeof vi.fn>;
    }> = [];

    const CopilotKitCore = vi.fn((config: Record<string, unknown>) => {
        const instance = {
            _config: config,
            setHeaders: vi.fn(),
            setProperties: vi.fn(),
        };
        coreInstances.push(instance);
        return instance;
    });

    return { coreInstances, CopilotKitCore };
});

vi.mock("@copilotkit/core", () => ({
    CopilotKitCore: hoisted.CopilotKitCore,
}));

import CopilotKitProvider from "./CopilotKitProvider.vue";
import { CopilotKitKey } from "./keys";

describe("CopilotKitProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        hoisted.coreInstances.length = 0;
    });

    it("constructs CopilotKitCore with mapped props", () => {
        const headers = { authorization: "Bearer token" };
        const properties = { app: "vue-tests" };
        const agentsUnsafeDevOnly = { sample: { id: "agent" } } as unknown as Record<string, never>;

        mount(CopilotKitProvider, {
            props: {
                runtimeUrl: "/api/copilotkit",
                headers,
                credentials: "include",
                properties,
                agentsUnsafeDevOnly,
            },
            slots: { default: () => "content" },
        });

        expect(hoisted.CopilotKitCore).toHaveBeenCalledTimes(1);
        expect(hoisted.CopilotKitCore).toHaveBeenCalledWith({
            runtimeUrl: "/api/copilotkit",
            headers,
            credentials: "include",
            properties,
            agents__unsafe_dev_only: agentsUnsafeDevOnly,
        });
    });

    it("provides copilot context values to descendants", () => {
        let injected: {
            threadId?: string;
            defaultThrottleMs?: number;
            copilotkit?: unknown;
        } | undefined;

        const Child = defineComponent({
            setup() {
                injected = inject(CopilotKitKey);
                return () => null;
            },
        });

        const Parent = defineComponent({
            components: { CopilotKitProvider, Child },
            template:
                '<CopilotKitProvider thread-id="thread-1" :default-throttle-ms="250"><Child /></CopilotKitProvider>',
        });

        mount(Parent);

        expect(injected).toBeDefined();
        expect(injected?.threadId).toBe("thread-1");
        expect(injected?.defaultThrottleMs).toBe(250);
        expect(injected?.copilotkit).toBe(hoisted.coreInstances[0]);
    });

    it("syncs headers and properties changes into CopilotKitCore", async () => {
        const wrapper = mount(CopilotKitProvider, {
            props: {
                headers: { authorization: "Bearer initial" },
                properties: { scope: "initial" },
            },
            slots: { default: () => "content" },
        });

        const instance = hoisted.coreInstances[0];

        await wrapper.setProps({
            headers: { authorization: "Bearer updated" },
            properties: { scope: "updated" },
        });
        await nextTick();

        expect(instance.setHeaders).toHaveBeenCalledWith({ authorization: "Bearer updated" });
        expect(instance.setProperties).toHaveBeenCalledWith({ scope: "updated" });
    });
});
