import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, provide } from "vue";
import { CopilotKitCore } from "@copilotkit/core";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotSidebar from "../components/chat/CopilotSidebar.vue";
import { CopilotKitKey, type CopilotKitContext } from "../providers/keys";

const StoryRuntimeProvider = defineComponent({
    name: "StoryRuntimeProvider",
    props: {
        runtimeUrl: {
            type: String,
            required: true,
        },
        threadId: {
            type: String,
            default: undefined,
        },
    },
    setup(props, { slots }) {
        const copilotkit = new CopilotKitCore({
            runtimeUrl: props.runtimeUrl,
            headers: undefined,
            credentials: undefined,
            properties: undefined,
            agents__unsafe_dev_only: undefined,
        });

        const context: CopilotKitContext = {
            copilotkit,
            threadId: props.threadId,
            defaultThrottleMs: undefined,
        };

        provide(CopilotKitKey, context);
        return () => slots.default?.();
    },
});

const meta = {
    title: "Scenarios/Live Agent Chat",
    tags: ["live-agent"],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Runtime-backed manual smoke stories. Start with `pnpm storybook:dev`, then send prompts and verify real agent responses.",
            },
        },
    },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const CopilotChatLive: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="storybook-live-chat">
            <div style="height: 100vh; max-width: 980px; margin: 0 auto; padding: 16px; box-sizing: border-box;">
              <CopilotChat
                agent-id="my_agent"
                :labels="{ title: 'Live Agent Chat', placeholder: 'Ask the live agent...' }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

export const CopilotSidebarLive: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotSidebar,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="storybook-live-sidebar">
            <div style="height: 100vh; box-sizing: border-box; padding: 12px;">
              <h3 style="margin: 0 0 8px;">Live Sidebar Smoke</h3>
              <p style="margin: 0 0 12px;">Open the chat, send a prompt, confirm response, then close/reopen to verify continuity.</p>
              <CopilotSidebar
                agent-id="my_agent"
                :default-open="true"
                :width="460"
                :labels="{ title: 'Live Sidebar Agent', placeholder: 'Try a multi-turn question' }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};