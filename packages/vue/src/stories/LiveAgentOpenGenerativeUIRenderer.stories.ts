import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent, ref } from "vue";
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

const presets = {
    kpi: {
        id: "kpi",
        label: "KPI panel",
        title: "Generated KPI Panel",
        minHeight: 280,
        html: `
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
`,
        css: `
body { margin: 0; padding: 14px; font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; }
.card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06); }
h2 { margin: 0; font-size: 16px; color: #0f172a; }
.muted { margin: 6px 0 10px; color: #64748b; font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
.grid div { background: #f1f5f9; border-radius: 8px; padding: 8px; display: grid; gap: 4px; }
.grid span { color: #64748b; font-size: 11px; }
.grid strong { color: #0f172a; font-size: 14px; }
button { border: 0; border-radius: 8px; background: #0f766e; color: white; padding: 7px 10px; cursor: pointer; }
`,
        js: `
const btn = document.getElementById('cta');
if (btn) {
  btn.addEventListener('click', () => {
    btn.textContent = 'Metrics Updated';
  });
}
`,
    },
    checklist: {
        id: "checklist",
        label: "Launch checklist",
        title: "Release Checklist",
        minHeight: 340,
        html: `
<section class="shell">
  <header>
    <h2>Release Checklist</h2>
    <p>OGUI can render longer layouts and richer CSS.</p>
  </header>
  <ul class="items">
    <li><input type="checkbox" checked /> Accessibility review</li>
    <li><input type="checkbox" checked /> Error budget check</li>
    <li><input type="checkbox" /> Stakeholder sign-off</li>
  </ul>
  <div class="footer">
    <button id="approve">Approve release</button>
    <span id="status">Pending final approval</span>
  </div>
</section>
`,
        css: `
body { margin: 0; padding: 18px; font-family: Georgia, 'Times New Roman', serif; background: linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%); }
.shell { border: 1px solid #fdba74; border-radius: 16px; background: rgba(255,255,255,0.85); padding: 16px; box-shadow: 0 18px 32px rgba(194, 65, 12, 0.10); }
header h2 { margin: 0; font-size: 18px; color: #7c2d12; }
header p { margin: 6px 0 14px; color: #9a3412; font-size: 13px; }
.items { list-style: none; padding: 0; margin: 0 0 16px; display: grid; gap: 10px; color: #431407; }
.items li { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 12px; background: #ffedd5; }
.footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
button { border: 0; border-radius: 999px; background: #c2410c; color: white; padding: 8px 14px; cursor: pointer; }
#status { font-size: 12px; color: #9a3412; }
`,
        js: `
const button = document.getElementById('approve');
const status = document.getElementById('status');
if (button && status) {
  button.addEventListener('click', () => {
    status.textContent = 'Approved at ' + new Date().toLocaleTimeString();
    button.textContent = 'Approved';
  });
}
`,
    },
    audit: {
        id: "audit",
        label: "Audit log",
        title: "Audit Timeline",
        minHeight: 220,
        html: `
<div class="timeline">
  <h2>Recent Events</h2>
  <ol>
    <li><strong>09:14</strong><span>Agent created an onboarding summary card.</span></li>
    <li><strong>09:17</strong><span>User edited the headline and requested a safer palette.</span></li>
    <li><strong>09:18</strong><span id="tail">Awaiting another event…</span></li>
  </ol>
  <button id="append">Append event</button>
</div>
`,
        css: `
body { margin: 0; padding: 16px; font-family: 'Trebuchet MS', sans-serif; background: #0f172a; }
.timeline { border-radius: 14px; background: #111827; color: #e5e7eb; border: 1px solid #334155; padding: 16px; }
h2 { margin: 0 0 12px; font-size: 16px; }
ol { margin: 0 0 14px; padding: 0; list-style: none; display: grid; gap: 10px; }
li { display: grid; grid-template-columns: 56px 1fr; gap: 10px; align-items: start; }
strong { color: #67e8f9; font-size: 12px; }
span { color: #cbd5e1; font-size: 13px; }
button { border: 1px solid #334155; border-radius: 10px; background: #1e293b; color: #f8fafc; padding: 7px 10px; cursor: pointer; }
`,
        js: `
const button = document.getElementById('append');
const tail = document.getElementById('tail');
if (button && tail) {
  button.addEventListener('click', () => {
    tail.textContent = 'Agent replayed sandbox JS successfully.';
  });
}
`,
    },
} as const;

const OGUIRendererLiveContent = defineComponent({
    name: "OGUIRendererLiveContent",
    components: { CopilotChat, OpenGenerativeUIRenderer },
    setup() {
        const activePreset = ref<keyof typeof presets>("kpi");
        const customTitle = ref("");
        const minHeight = ref<number>(presets.kpi.minHeight);
        const jsEnabled = ref(true);

        const selectedPreset = computed(() => presets[activePreset.value]);
        const resolvedTitle = computed(() => customTitle.value.trim() || selectedPreset.value.title);
        const resolvedMinHeight = computed(() => minHeight.value);
        const resolvedJs = computed(() => (jsEnabled.value ? selectedPreset.value.js : ""));

        function choosePreset(next: keyof typeof presets) {
            activePreset.value = next;
            customTitle.value = "";
            minHeight.value = presets[next].minHeight;
        }

        return {
            activePreset,
            choosePreset,
            customTitle,
            jsEnabled,
            minHeight,
            presetEntries: Object.values(presets),
            resolvedJs,
            resolvedMinHeight,
            resolvedTitle,
            selectedPreset,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:460px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:16px 14px;display:flex;flex-direction:column;gap:14px;overflow:auto;">
        <div style="display:grid;gap:6px;">
          <h3 style="margin:0;font-size:15px;">OpenGenerativeUIRenderer</h3>
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
            This story demonstrates the current Vue component surface: direct <code>html</code>, <code>css</code>, <code>js</code>, <code>title</code>, and <code>minHeight</code> props rendered in a sandboxed iframe.
          </p>
          <p style="margin:0;font-size:12px;color:#92400e;line-height:1.45;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:10px 12px;">
            React parity note: the upstream React analogue is a richer activity renderer with streaming preview, generation states, partial HTML processing, and separate <code>jsFunctions</code>/<code>jsExpressions</code>. Vue does not implement that surface yet, so this story now demonstrates the real Vue API instead of implying full parity.
          </p>
        </div>

        <div style="display:grid;gap:10px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <div>
            <div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:8px;">Presets</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              <button
                v-for="preset in presetEntries"
                :key="preset.id"
                type="button"
                @click="choosePreset(preset.id)"
                :style="{
                  border: activePreset === preset.id ? '1px solid #0f766e' : '1px solid #cbd5e1',
                  background: activePreset === preset.id ? '#ccfbf1' : '#ffffff',
                  color: activePreset === preset.id ? '#115e59' : '#334155',
                  borderRadius: '999px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <label style="display:grid;gap:6px;font-size:12px;color:#334155;">
            <span style="font-weight:600;color:#0f172a;">Title prop</span>
            <input v-model="customTitle" type="text" placeholder="Override iframe title"
              style="border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;font-size:13px;" />
          </label>

          <label style="display:grid;gap:6px;font-size:12px;color:#334155;">
            <span style="font-weight:600;color:#0f172a;">minHeight prop: {{ resolvedMinHeight }}px</span>
            <input v-model="minHeight" type="range" min="180" max="420" step="20" />
          </label>

          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#334155;">
            <input v-model="jsEnabled" type="checkbox" />
            <span><strong>js prop enabled</strong> — disable to verify HTML/CSS-only rendering.</span>
          </label>
        </div>

        <div style="display:grid;gap:10px;">
          <div style="font-size:12px;font-weight:600;color:#0f172a;">Live preview</div>
          <OpenGenerativeUIRenderer
            :html="selectedPreset.html"
            :css="selectedPreset.css"
            :js="resolvedJs"
            :title="resolvedTitle"
            :min-height="resolvedMinHeight"
          />
        </div>

        <div style="display:grid;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <div style="font-size:12px;font-weight:600;color:#0f172a;">What this story covers</div>
          <ul style="margin:0;padding-left:18px;font-size:12px;color:#475569;display:grid;gap:6px;line-height:1.45;">
            <li>Sandboxed iframe render of generated HTML + CSS.</li>
            <li>Optional JS execution path for interactive widgets.</li>
            <li>Title updates for accessibility and iframe document metadata.</li>
            <li>Variable min-height behavior for compact vs tall generated surfaces.</li>
            <li>Visual contrast across multiple generated UI styles.</li>
          </ul>
        </div>
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
          "Validates the real Vue OpenGenerativeUIRenderer surface: raw html/css/js/title/minHeight props inside a sandboxed iframe, with multiple presets and runtime-backed chat context. Also makes the React parity gap explicit: Vue does not yet implement the richer streaming activity renderer semantics from upstream React.",
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
