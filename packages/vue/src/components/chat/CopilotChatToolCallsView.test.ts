import { describe, expect, it } from "vitest";
import { h } from "vue";
import { mount } from "@vue/test-utils";
import type { AssistantMessage } from "@ag-ui/core";
import type { CopilotKitCore } from "@copilotkit/core";
import { upsertToolCallRenderer } from "../../adapters/toolCallRenderRegistry";
import { CopilotChatConfigurationKey, CopilotKitKey } from "../../providers/keys";
import CopilotChatToolCallsView from "./CopilotChatToolCallsView.vue";

function makeAssistantMessage(toolName: string, args = "{}", id = "a-1"): AssistantMessage {
    return {
        id,
        role: "assistant",
        content: "",
        toolCalls: [
            {
                id: `tc-${id}`,
                function: {
                    name: toolName,
                    arguments: args,
                },
            },
        ],
    } as AssistantMessage;
}

describe("CopilotChatToolCallsView", () => {
    it("prefers a custom renderer over the built-in A2UI fallback", () => {
        const core = {} as CopilotKitCore;
        upsertToolCallRenderer(core, {
            name: "render_a2ui",
            render: () => h("div", { "data-testid": "custom-render" }, "custom"),
        });

        const message = makeAssistantMessage(
            "render_a2ui",
            '{"placeholderMessages":["Building"],"components":[{"type":"container"}]}',
        );

        const wrapper = mount(CopilotChatToolCallsView, {
            props: {
                message,
                messages: [],
                isRunning: true,
            },
            global: {
                provide: {
                    [CopilotKitKey as symbol]: { copilotkit: core },
                    [CopilotChatConfigurationKey as symbol]: { agentId: "my_agent" },
                },
            },
        });

        expect(wrapper.find('[data-testid="custom-render"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="cpk-a2ui-progress"]').exists()).toBe(false);
    });

    it("renders built-in A2UI progress for render_a2ui when no custom renderer exists", () => {
        const core = {} as CopilotKitCore;
        const message = makeAssistantMessage(
            "render_a2ui",
            '{"placeholderMessages":["Building"],"components":[{"type":"container"}]}',
        );

        const wrapper = mount(CopilotChatToolCallsView, {
            props: {
                message,
                messages: [],
                isRunning: true,
            },
            global: {
                provide: {
                    [CopilotKitKey as symbol]: { copilotkit: core },
                    [CopilotChatConfigurationKey as symbol]: { agentId: "my_agent" },
                },
            },
        });

        expect(wrapper.find('[data-testid="cpk-a2ui-progress"]').exists()).toBe(true);
    });

    it("falls back to default tool badge for non-A2UI tools without custom renderers", () => {
        const core = {} as CopilotKitCore;
        const message = makeAssistantMessage("other_tool", '{"x":1}', "a-3");

        const wrapper = mount(CopilotChatToolCallsView, {
            props: {
                message,
                messages: [],
                isRunning: true,
            },
            global: {
                provide: {
                    [CopilotKitKey as symbol]: { copilotkit: core },
                    [CopilotChatConfigurationKey as symbol]: { agentId: "my_agent" },
                },
            },
        });

        expect(wrapper.find('[data-testid="cpk-a2ui-progress"]').exists()).toBe(false);
        expect(wrapper.text()).toContain("other_tool");
    });
});
