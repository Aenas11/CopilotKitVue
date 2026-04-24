import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import OpenGenerativeUIToolRenderer from "../components/tools/OpenGenerativeUIToolRenderer.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Open Generative UI Tool Renderer",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const OGUIToolRendererLiveContent = defineComponent({
    name: "OGUIToolRendererLiveContent",
    components: { CopilotChat, OpenGenerativeUIToolRenderer },
    setup() {
        const payload = ref({
            title: "Generated Risk Summary",
            minHeight: 250,
            html: `
        <div class="shell">
          <h3>Risk Summary</h3>
          <ul>
            <li><strong>Security:</strong> Medium</li>
            <li><strong>Reliability:</strong> Low</li>
            <li><strong>Cost:</strong> Medium</li>
          </ul>
          <button id="ack">Acknowledge</button>
        </div>
      `,
            css: `
        body { margin: 0; padding: 14px; font-family: ui-sans-serif, system-ui, sans-serif; background: #fff; }
        .shell { border: 1px solid #dbeafe; background: #eff6ff; border-radius: 12px; padding: 12px; }
        h3 { margin: 0 0 10px; color: #1e3a8a; }
        ul { margin: 0 0 10px; padding-left: 18px; color: #334155; }
        button { border: 0; border-radius: 8px; background: #1d4ed8; color: #fff; padding: 7px 10px; cursor: pointer; }
      `,
            js: `
        const ack = document.getElementById('ack');
        if (ack) {
          ack.addEventListener('click', () => {
            ack.textContent = 'Acknowledged';
          });
        }
      `,
        });

        return { payload };
    },
    template: `
    <div style="display:grid;grid-template-columns:390px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">OpenGenerativeUIToolRenderer</h3>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Dedicated tool payload renderer for Open Generative UI with normalized defaults.
        </p>
        <OpenGenerativeUIToolRenderer :payload="payload" />
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + OGUI Tool Renderer', placeholder: 'Ask to update risk summary UI...' }"
        />
      </main>
    </div>
  `,
});

export const ToolPayloadLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates OpenGenerativeUIToolRenderer payload normalization and rendering behavior in a live runtime-backed page.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, OGUIToolRendererLiveContent },
        data() {
            return {
                threadId: `story-phase-c-ogui-tool-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <OGUIToolRendererLiveContent />
      </StoryRuntimeProvider>
    `,
    }),
};
