import { defineComponent, inject } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { CopilotKitCore } from "@copilotkit/core";
import CopilotKitProvider from "../providers/CopilotKitProvider.vue";
import { getToolCallRenderer } from "../adapters/toolCallRenderRegistry";
import { useRenderTool } from "./useRenderTool";
import { CopilotKitKey } from "../providers/keys";

describe("useRenderTool", () => {
    it("registers and unregisters renderer with component lifecycle", () => {
        const renderFn = () => null;
        let capturedCore: CopilotKitCore | null = null;

        const RegistrationProbe = defineComponent({
            name: "RegistrationProbe",
            setup() {
                const ctx = inject(CopilotKitKey);
                capturedCore = (ctx?.copilotkit ?? null) as CopilotKitCore | null;

                useRenderTool({
                    name: "tool-alpha",
                    render: renderFn,
                    agentId: "agent-1",
                });
                return () => null;
            },
        });

        const wrapper = mount(CopilotKitProvider, {
            props: {
                runtimeUrl: "/api/copilotkit",
            },
            slots: {
                default: RegistrationProbe,
            },
        });

        expect(capturedCore).toBeTruthy();
        if (!capturedCore) {
            throw new Error("Expected CopilotKit core to be injected");
        }

        const registered = getToolCallRenderer(capturedCore, {
            name: "tool-alpha",
            agentId: "agent-1",
        });
        expect(registered?.render).toBe(renderFn);

        wrapper.unmount();

        const afterUnmount = getToolCallRenderer(capturedCore, {
            name: "tool-alpha",
            agentId: "agent-1",
        });
        expect(afterUnmount).toBeUndefined();
    });
});
