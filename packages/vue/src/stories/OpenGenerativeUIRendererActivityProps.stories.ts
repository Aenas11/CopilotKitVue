import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent, ref } from "vue";
import OpenGenerativeUIRenderer from "../components/tools/OpenGenerativeUIRenderer.vue";
import type { OpenGenerativeUIContent } from "../components/tools/openGenerativeUi";

const meta = {
    title: "Components/Tools/OpenGenerativeUIRenderer Activity Props",
    component: OpenGenerativeUIRenderer,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Focused harness for activity-style content props on OpenGenerativeUIRenderer. This story intentionally avoids live runtime integration so each content field can be tested deterministically.",
            },
        },
    },
} satisfies Meta<typeof OpenGenerativeUIRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

const ActivityPropsHarness = defineComponent({
    name: "ActivityPropsHarness",
    components: { OpenGenerativeUIRenderer },
    setup() {
        const initialHeight = ref(220);
        const generating = ref(true);
        const cssComplete = ref(false);
        const htmlComplete = ref(false);
        const includeJsFunctions = ref(true);

        const fullHtml = `
<div class="card">
  <h2 id="title">Activity Content Demo</h2>
  <p id="subtitle">HTML is complete and CSS is applied.</p>
  <div class="meta" id="meta">Waiting for expression...</div>
</div>
`;

        const partialHtml = `
<html><head><style>.card{padding:12px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;}</style></head><body><div class="card"><h2>Streaming preview...</h2><p>Partial HTML body</p><div class="meta" id="meta">`
            ;

        const jsExpressions = ref<string[]>([]);

        const content = computed<OpenGenerativeUIContent>(() => ({
            initialHeight: initialHeight.value,
            generating: generating.value,
            css: `
body { margin: 0; padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; }
.card { border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff; padding: 14px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
h2 { margin: 0 0 8px; color: #0f172a; font-size: 18px; }
#subtitle { margin: 0 0 10px; color: #64748b; }
.meta { font-size: 12px; color: #475569; padding: 8px 10px; border-radius: 8px; background: #f1f5f9; }
`,
            cssComplete: cssComplete.value,
            html: htmlComplete.value ? [fullHtml] : [partialHtml],
            htmlComplete: htmlComplete.value,
            jsFunctions: includeJsFunctions.value
                ? "window.__oguiCounter = (window.__oguiCounter ?? 0) + 1;"
                : undefined,
            jsExpressions: jsExpressions.value,
        }));

        function addExpression() {
            const label = `Expression ${jsExpressions.value.length + 1}`;
            jsExpressions.value = [
                ...jsExpressions.value,
                `var el = document.getElementById('meta'); if (el) { el.textContent = '${label} executed'; }`,
            ];
        }

        function reset() {
            initialHeight.value = 220;
            generating.value = true;
            cssComplete.value = false;
            htmlComplete.value = false;
            includeJsFunctions.value = true;
            jsExpressions.value = [];
        }

        return {
            addExpression,
            content,
            cssComplete,
            generating,
            htmlComplete,
            includeJsFunctions,
            initialHeight,
            jsExpressions,
            reset,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px;min-height:560px;">
      <aside style="display:grid;gap:10px;align-content:start;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <h3 style="margin:0;font-size:14px;color:#0f172a;">Activity Content Controls</h3>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Demonstrates OpenGenerativeUIRenderer content props:
          initialHeight, generating, css/cssComplete, html/htmlComplete, jsFunctions, jsExpressions.
        </p>

        <label style="display:grid;gap:6px;font-size:12px;color:#334155;">
          <span style="font-weight:600;color:#0f172a;">initialHeight: {{ initialHeight }}px</span>
          <input v-model="initialHeight" type="range" min="180" max="420" step="10" />
        </label>

        <label style="display:flex;gap:8px;align-items:center;font-size:12px;color:#334155;">
          <input v-model="generating" type="checkbox" />
          generating
        </label>

        <label style="display:flex;gap:8px;align-items:center;font-size:12px;color:#334155;">
          <input v-model="cssComplete" type="checkbox" />
          cssComplete
        </label>

        <label style="display:flex;gap:8px;align-items:center;font-size:12px;color:#334155;">
          <input v-model="htmlComplete" type="checkbox" />
          htmlComplete
        </label>

        <label style="display:flex;gap:8px;align-items:center;font-size:12px;color:#334155;">
          <input v-model="includeJsFunctions" type="checkbox" />
          jsFunctions enabled
        </label>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" @click="addExpression" style="border:1px solid #cbd5e1;background:#ffffff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;">Add jsExpression</button>
          <button type="button" @click="reset" style="border:1px solid #cbd5e1;background:#ffffff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;">Reset</button>
        </div>

        <div style="font-size:11px;color:#475569;">jsExpressions count: <strong>{{ jsExpressions.length }}</strong></div>
      </aside>

      <main style="min-width:0;">
        <OpenGenerativeUIRenderer :content="content" title="Activity Props Harness" />
      </main>
    </div>
  `,
});

export const ActivityContentProps: Story = {
    render: () => ({
        components: { ActivityPropsHarness },
        template: `<ActivityPropsHarness />`,
    }),
};
