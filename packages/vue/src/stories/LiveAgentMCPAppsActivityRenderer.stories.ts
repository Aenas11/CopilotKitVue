import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import MCPAppsActivityRenderer from "../components/tools/MCPAppsActivityRenderer.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/MCP Apps Activity Renderer",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const MCPActivityLiveContent = defineComponent({
    name: "MCPActivityLiveContent",
    components: { CopilotChat, MCPAppsActivityRenderer },
    setup() {
        const activity = ref({
            app: "storybook-demo",
            event: "tool-call",
            status: "completed",
            durationMs: 183,
            metadata: {
                threadId: "phase-c-mcp",
                tool: "show_storybook_status",
            },
        });

        return { activity };
    },
    template: `
    <div style="display:grid;grid-template-columns:360px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">MCPAppsActivityRenderer</h3>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Dedicated renderer for MCP activity payloads. Update payload shape in code to verify fallback and serialization behavior.
        </p>
        <MCPAppsActivityRenderer title="Latest MCP event" :activity="activity" />
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + MCP Activity Panel', placeholder: 'Ask for current storybook status...' }"
        />
      </main>
    </div>
  `,
});

export const ActivityPayloadLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates MCP activity payload rendering in a real runtime-backed story context.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, MCPActivityLiveContent },
        data() {
            return {
                threadId: `story-phase-c-mcp-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <MCPActivityLiveContent />
      </StoryRuntimeProvider>
    `,
    }),
};
