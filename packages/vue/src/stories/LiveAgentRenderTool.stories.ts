import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, h, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { useFrontendTool } from "../composables/useFrontendTool";
import { useRenderTool } from "../composables/useRenderTool";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Advanced Scenarios/Tool Rendering",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const RenderToolLiveContent = defineComponent({
    components: { CopilotChat },
    setup() {
        const statusCalls = ref(0);

        useFrontendTool({
            name: "get_storybook_status",
            description:
                "Returns Storybook live demo status. Call this when user asks for storybook status or asks to verify this demo is running.",
            agentId: "my_agent",
            handler: async () => {
                statusCalls.value += 1;
                return {
                    status: "ok",
                    source: "storybook-live",
                    calls: statusCalls.value,
                    timestamp: new Date().toISOString(),
                };
            },
        });

        useRenderTool({
            name: "get_storybook_status",
            render: ({ result, status }) =>
                h(
                    "div",
                    {
                        style: {
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #c7d2fe",
                            background: "#eef2ff",
                            color: "#312e81",
                            fontSize: "12px",
                            marginTop: "6px",
                        },
                    },
                    [
                        h("strong", "Storybook Tool Renderer"),
                        h("div", `status: ${status}`),
                        h(
                            "pre",
                            {
                                style: {
                                    margin: "6px 0 0",
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "ui-monospace, monospace",
                                },
                            },
                            JSON.stringify(result, null, 2),
                        ),
                    ],
                ),
        });

        return { statusCalls };
    },
    template: `
      <div style="display: flex; height: 100vh;">
        <aside style="width: 280px; padding: 16px; background: #f8fafc; border-right: 1px solid #e2e8f0; overflow-y: auto;">
          <h3 style="margin: 0 0 12px;">Render Tool Live</h3>
          <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0 0 10px;">
            This story uses <code>useRenderTool</code> to render tool results inside chat.
          </p>
          <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0 0 10px;">
            Try prompts:
            <br />- "What is the storybook status?"
            <br />- "Call get_storybook_status and show raw output"
          </p>
          <div style="margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 12px;">
            Local tool calls observed: <strong>{{ statusCalls }}</strong>
          </div>
        </aside>
        <main style="flex: 1;">
          <CopilotChat
            agent-id="my_agent"
            :labels="{ title: 'Tool Rendering Workflow', placeholder: 'Ask for storybook status...' }"
          />
        </main>
      </div>
    `,
});

export const RenderToolLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates custom tool rendering in a real runtime flow. " +
                    "Raw tool payloads are technical; useRenderTool transforms them into domain-focused UI that improves trust, comprehension, and debugging.",
            },
        },
    },
    render: () => ({
        components: {
            RenderToolLiveContent,
            StoryRuntimeProvider,
        },
        data() {
            return {
                threadId: `story-render-tool-live-${Date.now()}`,
            };
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
            <RenderToolLiveContent />
          </StoryRuntimeProvider>
        `,
    }),
};