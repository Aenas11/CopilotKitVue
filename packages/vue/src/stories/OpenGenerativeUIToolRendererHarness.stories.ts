import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import OpenGenerativeUIToolRenderer from "../components/tools/OpenGenerativeUIToolRenderer.vue";

const meta = {
    title: "Components/Tools/OpenGenerativeUIToolRenderer Harness",
    tags: ["advanced", "autodocs"],
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof OpenGenerativeUIToolRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

const OGUIToolRendererLiveContent = defineComponent({
    name: "OGUIToolRendererLiveContent",
    components: { OpenGenerativeUIToolRenderer },
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
    <div style="display:grid;grid-template-columns:390px minmax(0,1fr);height:100dvh;min-height:100%;overflow:hidden;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">OpenGenerativeUIToolRenderer</h3>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Dedicated payload harness for OpenGenerativeUIToolRenderer with normalized defaults.
        </p>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Use this story when validating payload-to-UI mapping only. It does not mount CopilotChat, does not register tools, and does not require runtime or agent responses.
        </p>
        <div style="padding:10px;border:1px solid #fde68a;border-radius:10px;background:#fffbeb;color:#78350f;font-size:12px;line-height:1.45;">
          Need end-to-end agent behavior? Use <strong>Workflows/Live Agent/Phase C/Open Generative UI - Agent Tool Integration</strong> instead.
        </div>
        <OpenGenerativeUIToolRenderer :payload="payload" />
      </aside>

      <main style="min-width:0;">
        <div style="padding:20px;display:grid;gap:12px;align-content:start;">
          <h3 style="margin:0;font-size:16px;color:#0f172a;">Deterministic Harness</h3>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;max-width:720px;">
            Right panel intentionally avoids live chat/runtime integration. Edit payload values in this file to verify normalization and rendering behavior deterministically.
          </p>
        </div>
      </main>
    </div>
  `,
});

export const ToolPayloadHarness: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: component-level validation of OpenGenerativeUIToolRenderer payload normalization and rendering in isolation. This harness is deterministic and does not involve CopilotChat, tool registration, model tool-choice, or runtime transport.",
            },
        },
    },
    render: () => ({
        components: { OGUIToolRendererLiveContent },
        template: `<OGUIToolRendererLiveContent />`,
    }),
};
