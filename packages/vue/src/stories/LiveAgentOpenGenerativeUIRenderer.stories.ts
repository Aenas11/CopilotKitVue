import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, h, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import OpenGenerativeUIToolRenderer from "../components/tools/OpenGenerativeUIToolRenderer.vue";
import { useFrontendTool } from "../composables/useFrontendTool";
import { useRenderTool } from "../composables/useRenderTool";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Open Generative UI - Agent Tool Integration",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function escapeStoryHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

interface EventPreviewPayload {
    title?: string;
    date?: string;
    time?: string;
    timezone?: string;
    notes?: string;
}

function asEventPreviewPayload(value: unknown): EventPreviewPayload {
    if (!value) return {};
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            return asEventPreviewPayload(parsed);
        } catch {
            return {};
        }
    }
    if (typeof value !== "object") return {};

    const record = value as Record<string, unknown>;
    const source = (typeof record.event === "object" && record.event)
        ? (record.event as Record<string, unknown>)
        : record;

    return {
        title: typeof source.title === "string" ? source.title : undefined,
        date: typeof source.date === "string" ? source.date : undefined,
        time: typeof source.time === "string" ? source.time : undefined,
        timezone: typeof source.timezone === "string" ? source.timezone : undefined,
        notes: typeof source.notes === "string" ? source.notes : undefined,
    };
}

const OGUIRendererLiveContent = defineComponent({
    name: "OGUIRendererLiveContent",
    components: { CopilotChat },
    setup() {
        const liveToolCalls = ref(0);

        useFrontendTool({
            name: "render_calendar_event_preview",
            agentId: "my_agent",
            description:
                "Renders a calendar event preview card in the chat. IMPORTANT: This tool REQUIRES you to extract and provide the following fields from the user's message: (1) title - the event name (required), (2) date - the event date like 'Apr 24, 2026' or 'today' (required), (3) time - the event time like '10:00 AM' (required), (4) timezone - the timezone like 'Brisbane time' or 'AEST' (required), (5) notes - optional additional details. Always parse these values from the user's input message before calling this tool. Do not call with missing or empty values. After calling this tool, do not send a follow-up assistant text summary unless explicitly asked.",
            handler: async (args) => {
                liveToolCalls.value += 1;
                const eventArgs = args as Record<string, unknown>;
                return JSON.stringify({
                    title: eventArgs.title || "Scheduled Event",
                    date: eventArgs.date || "Date pending",
                    time: eventArgs.time || "Time pending",
                    timezone: eventArgs.timezone || "Timezone pending",
                    notes: eventArgs.notes || "",
                });
            },
        });

        useRenderTool({
            name: "render_calendar_event_preview",
            agentId: "my_agent",
            render: ({ args, result, status }) => {
                // Prefer completed tool result payload to avoid stale/incomplete args during stream updates.
                const argsPayload = asEventPreviewPayload(args);
                const resultPayload = asEventPreviewPayload(result);
                const payload = status === "complete"
                    ? { ...argsPayload, ...resultPayload }
                    : argsPayload;

                const title = typeof payload.title === "string" && payload.title.trim()
                    ? payload.title.trim()
                    : "Scheduled Event";
                const date = typeof payload.date === "string" && payload.date.trim() ? payload.date : "Date pending";
                const time = typeof payload.time === "string" && payload.time.trim() ? payload.time : "Time pending";
                const timezone = typeof payload.timezone === "string" && payload.timezone.trim()
                    ? payload.timezone
                    : "Timezone pending";
                const notes = typeof payload.notes === "string" ? payload.notes : "";

                return h(OpenGenerativeUIToolRenderer, {
                    payload: {
                        title: `${title} Preview`,
                        minHeight: 240,
                        html: `
<div class="event-card">
  <p class="event-card__eyebrow">Open Generative UI Preview</p>
  <h2>${escapeStoryHtml(title)}</h2>
  <dl class="event-card__grid">
    <div><dt>Date</dt><dd>${escapeStoryHtml(date)}</dd></div>
    <div><dt>Time</dt><dd>${escapeStoryHtml(time)}</dd></div>
    <div><dt>Timezone</dt><dd>${escapeStoryHtml(timezone)}</dd></div>
  </dl>
  ${notes ? `<p class="event-card__notes">${escapeStoryHtml(notes)}</p>` : ""}
</div>
`,
                        css: `
body { margin: 0; padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%); }
.event-card { background: #ffffff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 16px; box-shadow: 0 12px 24px rgba(30, 64, 175, 0.08); color: #1e1b4b; }
.event-card__eyebrow { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #4338ca; }
.event-card h2 { margin: 0 0 14px; font-size: 18px; }
.event-card__grid { margin: 0; display: grid; gap: 10px; }
.event-card__grid div { padding: 10px 12px; border-radius: 12px; background: #eef2ff; }
.event-card__grid dt { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6366f1; margin-bottom: 4px; }
.event-card__grid dd { margin: 0; font-size: 14px; color: #312e81; }
.event-card__notes { margin: 14px 0 0; padding: 10px 12px; border-radius: 12px; background: #f8fafc; color: #475569; }
`,
                        js: `
document.body.dataset.oguiInteractive = "true";
`,
                    },
                    fallbackTitle: "Event Preview",
                });
            },
        });

        return {
            liveToolCalls,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:360px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:16px 14px;display:flex;flex-direction:column;gap:14px;overflow:auto;">
        <div style="display:grid;gap:6px;">
          <h3 style="margin:0;font-size:15px;">Live Agent Component Rendering</h3>
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
            This story validates the full agent-tool flow: the model chooses a frontend tool, emits args, and chat renders the resulting Open Generative UI card.
          </p>
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
            Use this story when testing tool registration, arg extraction, streaming updates, and final rendered output in live chat.
          </p>
        </div>

        <div style="display:grid;gap:8px;padding:12px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;">
          <div style="font-size:12px;font-weight:600;color:#92400e;">How this differs from "OGUI Tool Renderer" story</div>
          <div style="font-size:12px;color:#78350f;line-height:1.45;">
            This one is <strong>agent-first integration</strong>: the renderer output depends on real tool-call messages in chat.
            The "OGUI Tool Renderer" story is a <strong>direct payload harness</strong> that bypasses tool-call registration and model behavior.
          </div>
        </div>

        <div style="display:grid;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <div style="font-size:12px;font-weight:600;color:#0f172a;">Live tool: render_calendar_event_preview</div>
          <p style="margin:0 0 8px;font-size:12px;color:#475569;line-height:1.45;">
            This story registers a frontend tool that extracts event details (title, date, time, timezone) and renders a preview card in the chat.
          </p>
          <div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:6px;">Try these prompts:</div>
          <ul style="margin:0;padding:0;font-size:11px;color:#334155;line-height:1.5;display:grid;gap:6px;">
            <li style="margin-left:16px;">Schedule an event titled "test" for Apr 24 2026 at 10:00 AM Brisbane time and show the preview</li>
            <li style="margin-left:16px;">Add a meeting for today at 3 PM in your local timezone</li>
            <li style="margin-left:16px;">Create an event titled "Project review" tomorrow at 10:30 AM Sydney time</li>
          </ul>
          <div style="margin-top:8px;padding:8px;border-radius:8px;background:#eff6ff;border:1px solid #bae6fd;">
            <div style="font-size:11px;font-weight:600;color:#0c4a6e;">Tool calls observed: <strong>{{ liveToolCalls }}</strong></div>
            <div style="font-size:10px;color:#475569;margin-top:4px;">If this stays at 0 after a message, the tool registration did not mount.</div>
          </div>
        </div>

        <div style="display:grid;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <div style="font-size:12px;font-weight:600;color:#0f172a;">OpenGenerativeUIRenderer prop coverage</div>
          <ul style="margin:0;padding-left:18px;font-size:12px;color:#475569;display:grid;gap:6px;line-height:1.45;">
            <li>Demonstrated via tool payload: <code>title</code>, <code>minHeight</code>, <code>html</code>, <code>css</code>, <code>js</code>.</li>
            <li>Not demonstrated in this story (agent-focused): <code>content.initialHeight</code>, <code>content.generating</code>, <code>content.cssComplete</code>, <code>content.htmlComplete</code>, <code>content.jsFunctions</code>, <code>content.jsExpressions</code>.</li>
          </ul>
        </div>

        <div style="display:grid;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <div style="font-size:12px;font-weight:600;color:#0f172a;">What this story covers</div>
          <ul style="margin:0;padding-left:18px;font-size:12px;color:#475569;display:grid;gap:6px;line-height:1.45;">
            <li>Live chat registration of a frontend tool for event-preview rendering.</li>
            <li>Rendering a real Open Generative UI card from tool call args/result.</li>
            <li>Resilience to streaming args and complete tool-result payload merges.</li>
            <li>Runtime-backed validation that the agent is invoking component rendering tools.</li>
          </ul>
        </div>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + OGUI Renderer', placeholder: 'Ask to schedule an event and render the preview card...' }"
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
                    "Agent-first live scenario for Open Generative UI component rendering. Use this to verify end-to-end tool integration: frontend tool registration, model tool-call args, streamed updates, and finalized card rendering in chat. If you only need to validate static payload-to-UI mapping, use the separate OGUI Tool Renderer story.",
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
