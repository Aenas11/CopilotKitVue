import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import OpenGenerativeUIRenderer from "../components/tools/OpenGenerativeUIRenderer.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Open Generative UI Renderer",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const html = `
<div class="card">
  <h2>Generated KPI Panel</h2>
  <p class="muted">Created inside sandboxed iframe</p>
  <div class="grid">
    <div><span>Conversion</span><strong>14.8%</strong></div>
    <div><span>ARR</span><strong>$2.4M</strong></div>
    <div><span>Churn</span><strong>1.6%</strong></div>
  </div>
  <button id="cta">Refresh Metrics</button>
</div>
`;

const css = `
body { margin: 0; padding: 14px; font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; }
.card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06); }
h2 { margin: 0; font-size: 16px; color: #0f172a; }
.muted { margin: 6px 0 10px; color: #64748b; font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
.grid div { background: #f1f5f9; border-radius: 8px; padding: 8px; display: grid; gap: 4px; }
.grid span { color: #64748b; font-size: 11px; }
.grid strong { color: #0f172a; font-size: 14px; }
button { border: 0; border-radius: 8px; background: #0f766e; color: white; padding: 7px 10px; cursor: pointer; }
`;

const js = `
const btn = document.getElementById('cta');
if (btn) {
  btn.addEventListener('click', () => {
    btn.textContent = 'Metrics Updated';
  });
}
`;

const OGUIRendererLiveContent = defineComponent({
    name: "OGUIRendererLiveContent",
    components: { CopilotChat, OpenGenerativeUIRenderer },
    setup() {
        return { css, html, js };
    },
    template: `
    <div style="display:grid;grid-template-columns:390px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">OpenGenerativeUIRenderer</h3>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Dedicated sandboxed iframe renderer for generated HTML/CSS/JS payloads.
        </p>
        <OpenGenerativeUIRenderer :html="html" :css="css" :js="js" title="Generated KPI Panel" :min-height="280" />
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + OGUI Renderer', placeholder: 'Ask for UI card variations...' }"
        />
      </main>
    </div>
  `,
});

export const SandboxedIframeLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates sandboxed Open Generative UI rendering path while preserving live runtime/agent context.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, OGUIRendererLiveContent },
        data() {
            return {
                threadId: `story-phase-c-ogui-renderer-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <OGUIRendererLiveContent />
      </StoryRuntimeProvider>
    `,
    }),
};
