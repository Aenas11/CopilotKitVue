import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { useComponent } from "../composables/useComponent";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Advanced Scenarios/Generative UI",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ── Shared inline Vue components ─────────────────────────────────────────────

/** Rendered by the agent when it calls the `show_weather_card` tool. */
const WeatherCard = defineComponent({
    name: "WeatherCard",
    props: {
        city: { type: String, default: "Unknown" },
        temperature: { type: Number, default: 0 },
        condition: { type: String, default: "" },
        humidity: { type: Number, default: 0 },
        windKph: { type: Number, default: 0 },
    },
    setup(props) {
        const conditionEmoji = (c: string) => {
            const lower = c.toLowerCase();
            if (lower.includes("sun") || lower.includes("clear")) return "☀️";
            if (lower.includes("cloud")) return "☁️";
            if (lower.includes("rain")) return "🌧️";
            if (lower.includes("snow")) return "❄️";
            if (lower.includes("storm") || lower.includes("thunder")) return "⛈️";
            if (lower.includes("fog") || lower.includes("mist")) return "🌫️";
            return "🌡️";
        };
        return { conditionEmoji, props };
    },
    template: `
      <div style="
        display: inline-flex; flex-direction: column; gap: 6px;
        padding: 14px 18px; border-radius: 14px;
        background: linear-gradient(135deg, #1d4ed8 0%, #0369a1 100%);
        color: white; min-width: 200px; max-width: 260px;
        box-shadow: 0 4px 14px rgba(3, 105, 161, 0.4);
        font-family: system-ui, sans-serif;
      ">
        <div style="font-size: 13px; font-weight: 600; opacity: 0.85; letter-spacing: 0.5px;">
          {{ props.city.toUpperCase() }}
        </div>
        <div style="display: flex; align-items: flex-end; gap: 10px;">
          <div style="font-size: 40px; line-height: 1;">{{ conditionEmoji(props.condition) }}</div>
          <div>
            <div style="font-size: 32px; font-weight: 700; line-height: 1.1;">{{ props.temperature }}°C</div>
            <div style="font-size: 13px; opacity: 0.85;">{{ props.condition }}</div>
          </div>
        </div>
        <div style="display: flex; gap: 14px; font-size: 12px; opacity: 0.8; margin-top: 2px;">
          <span>💧 {{ props.humidity }}%</span>
          <span>💨 {{ props.windKph }} km/h</span>
        </div>
      </div>
    `,
});

/** Rendered by the agent when it calls the `show_metric_card` tool. */
const MetricCard = defineComponent({
    name: "MetricCard",
    props: {
        label: { type: String, default: "Metric" },
        value: { type: [String, Number], default: "—" },
        unit: { type: String, default: "" },
        trend: { type: String, default: "" }, // "up" | "down" | "flat"
        description: { type: String, default: "" },
    },
    setup(props) {
        const trendIcon = (t: string) => {
            if (t === "up") return "↑";
            if (t === "down") return "↓";
            return "→";
        };
        const trendColor = (t: string) => {
            if (t === "up") return "#16a34a";
            if (t === "down") return "#dc2626";
            return "#64748b";
        };
        return { trendIcon, trendColor, props };
    },
    template: `
      <div style="
        display: inline-flex; flex-direction: column; gap: 4px;
        padding: 14px 18px; border-radius: 12px;
        border: 1px solid #e2e8f0; background: #fff;
        min-width: 180px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        font-family: system-ui, sans-serif;
      ">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
          {{ props.label }}
        </div>
        <div style="display: flex; align-items: baseline; gap: 6px;">
          <span style="font-size: 30px; font-weight: 700; color: #0f172a; line-height: 1.1;">{{ props.value }}</span>
          <span v-if="props.unit" style="font-size: 14px; color: #64748b;">{{ props.unit }}</span>
          <span
            v-if="props.trend"
            :style="{ fontSize: '14px', fontWeight: '600', color: trendColor(props.trend) }"
          >{{ trendIcon(props.trend) }}</span>
        </div>
        <div v-if="props.description" style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
          {{ props.description }}
        </div>
      </div>
    `,
});

/** Rendered by the agent when it calls the `show_task_card` tool. */
const TaskCard = defineComponent({
    name: "TaskCard",
    props: {
        title: { type: String, default: "Task" },
        priority: { type: String, default: "medium" }, // "low" | "medium" | "high" | "critical"
        assignee: { type: String, default: "" },
        dueDate: { type: String, default: "" },
        status: { type: String, default: "open" }, // "open" | "in-progress" | "done"
        description: { type: String, default: "" },
    },
    setup(props) {
        const priorityColor = (p: string) => {
            if (p === "critical") return { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" };
            if (p === "high") return { bg: "#fff7ed", border: "#fdba74", text: "#9a3412" };
            if (p === "medium") return { bg: "#fefce8", border: "#fde047", text: "#713f12" };
            return { bg: "#f0fdf4", border: "#86efac", text: "#14532d" };
        };
        const statusColor = (s: string) => {
            if (s === "done") return "#16a34a";
            if (s === "in-progress") return "#2563eb";
            return "#64748b";
        };
        return { priorityColor, statusColor, props };
    },
    template: `
      <div style="
        display: inline-flex; flex-direction: column; gap: 8px;
        padding: 14px 16px; border-radius: 12px;
        border: 1px solid #e2e8f0; background: #fff;
        min-width: 220px; max-width: 300px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        font-family: system-ui, sans-serif;
      ">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.3;">{{ props.title }}</div>
          <span :style="{
            fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '999px',
            background: priorityColor(props.priority).bg,
            border: '1px solid ' + priorityColor(props.priority).border,
            color: priorityColor(props.priority).text,
            whiteSpace: 'nowrap',
          }">{{ props.priority }}</span>
        </div>
        <div v-if="props.description" style="font-size: 12px; color: #64748b; line-height: 1.4;">
          {{ props.description }}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 2px;">
          <span v-if="props.assignee">👤 {{ props.assignee }}</span>
          <span v-if="props.dueDate">📅 {{ props.dueDate }}</span>
          <span :style="{ color: statusColor(props.status) }">● {{ props.status }}</span>
        </div>
      </div>
    `,
});

// ── Story 1: Single component (WeatherCard) ───────────────────────────────────

const WeatherCardDemo = defineComponent({
    components: { CopilotChat, WeatherCard },
    setup() {
        const renderCount = ref(0);

        useComponent({
            name: "show_weather_card",
            description:
                "Renders a weather card for a city. " +
                "Parameters: city (string — city name), temperature (number — degrees Celsius), " +
                "condition (string — e.g. 'Sunny', 'Partly Cloudy', 'Rainy', 'Snowy'), " +
                "humidity (number — percentage 0–100), windKph (number — wind speed in km/h). " +
                "Call this whenever the user asks about weather or temperature.",
            component: WeatherCard,
            agentId: "my_agent",
        });

        return { renderCount };
    },
    template: `
      <div style="display: flex; height: 100vh;">
        <aside style="width: 300px; padding: 16px; background: #f8fafc; border-right: 1px solid #e2e8f0; overflow-y: auto; font-family: system-ui, sans-serif;">
          <h3 style="margin: 0 0 10px; font-size: 15px; color: #1e293b;">Generative UI — WeatherCard</h3>
          <p style="font-size: 12px; color: #64748b; line-height: 1.55; margin: 0 0 12px;">
            The agent uses <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 4px;">useComponent</code>
            to register a <strong>WeatherCard</strong> Vue component. When you mention a city or ask
            about weather, it calls <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 4px;">show_weather_card</code>
            and renders the component inline in chat.
          </p>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Try these prompts</div>
            <div style="font-size: 12px; color: #475569; display: flex; flex-direction: column; gap: 4px;">
              <div>→ "What's the weather like in Tokyo?"</div>
              <div>→ "Show me the current conditions in London"</div>
              <div>→ "Give me a weather card for Sydney"</div>
              <div>→ "What's it like in New York today?"</div>
            </div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #3b82f6; margin-bottom: 6px;">Component Preview</div>
            <WeatherCard city="Demo City" :temperature="22" condition="Sunny" :humidity="55" :windKph="18" />
          </div>
        </aside>
        <main style="flex: 1; overflow: hidden;">
          <CopilotChat
            agent-id="my_agent"
            :labels="{ title: 'Generative UI — Weather', placeholder: 'Ask about weather in any city…' }"
          />
        </main>
      </div>
    `,
});

export const WeatherCardLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates the useComponent Generative UI pipeline end-to-end. " +
                    "The agent registers a WeatherCard Vue component as a callable tool. " +
                    "When the user asks about weather the agent calls show_weather_card and Vue renders the card " +
                    "inline in the chat stream — verifying tool discovery, arg passing, and component mounting.",
            },
        },
    },
    render: () => ({
        components: { WeatherCardDemo, StoryRuntimeProvider },
        data() {
            return { threadId: `story-genui-weather-${Date.now()}` };
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
            <WeatherCardDemo />
          </StoryRuntimeProvider>
        `,
    }),
};

// ── Story 2: Multiple components – MetricCard and TaskCard ────────────────────

const MultiComponentDemo = defineComponent({
    components: { CopilotChat, MetricCard, TaskCard },
    setup() {
        useComponent({
            name: "show_metric_card",
            description:
                "Displays a KPI or metric card inline in chat. " +
                "Parameters: label (string — metric name, e.g. 'Monthly Revenue'), " +
                "value (string or number — the metric value), unit (string — e.g. '$', '%', 'ms', optional), " +
                "trend (string — 'up', 'down', or 'flat', optional), " +
                "description (string — short context sentence, optional). " +
                "Use this when the user asks for stats, numbers, KPIs, or performance metrics.",
            component: MetricCard,
            agentId: "my_agent",
        });

        useComponent({
            name: "show_task_card",
            description:
                "Displays a task or ticket card inline in chat. " +
                "Parameters: title (string — task title), " +
                "priority (string — 'low', 'medium', 'high', or 'critical'), " +
                "assignee (string — name of assignee, optional), " +
                "dueDate (string — due date like '2026-05-01', optional), " +
                "status (string — 'open', 'in-progress', or 'done'), " +
                "description (string — brief task description, optional). " +
                "Use this when the user asks about tasks, tickets, todos, or work items.",
            component: TaskCard,
            agentId: "my_agent",
        });

        return {};
    },
    template: `
      <div style="display: flex; height: 100vh;">
        <aside style="width: 300px; padding: 16px; background: #f8fafc; border-right: 1px solid #e2e8f0; overflow-y: auto; font-family: system-ui, sans-serif;">
          <h3 style="margin: 0 0 10px; font-size: 15px; color: #1e293b;">Generative UI — Multi-Component</h3>
          <p style="font-size: 12px; color: #64748b; line-height: 1.55; margin: 0 0 12px;">
            Two components registered via <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 4px;">useComponent</code>.
            The agent picks the right one based on your prompt.
          </p>

          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Metric prompts</div>
            <div style="font-size: 12px; color: #475569; display: flex; flex-direction: column; gap: 4px;">
              <div>→ "Show our monthly revenue of $142k (up)"</div>
              <div>→ "Display API latency: 84ms, trending down"</div>
              <div>→ "Metric: churn rate 3.2%, flat"</div>
            </div>
          </div>

          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Task prompts</div>
            <div style="font-size: 12px; color: #475569; display: flex; flex-direction: column; gap: 4px;">
              <div>→ "Add task: implement dark mode, high priority, Alex, due 2026-05-15"</div>
              <div>→ "Show critical ticket: production bug in auth service"</div>
              <div>→ "Create a done task: homepage redesign, assigned to Sam"</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Previews</div>
            <MetricCard label="Monthly Revenue" value="$142k" trend="up" description="vs last month" />
            <TaskCard title="Implement dark mode" priority="high" assignee="Alex" status="in-progress" />
          </div>
        </aside>
        <main style="flex: 1; overflow: hidden;">
          <CopilotChat
            agent-id="my_agent"
            :labels="{ title: 'Generative UI — Multi-Component', placeholder: 'Ask for a metric or a task…' }"
          />
        </main>
      </div>
    `,
});

export const MultiComponentLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates multi-component registration and agent-driven component selection. " +
                    "Two components — MetricCard and TaskCard — are registered via separate useComponent calls. " +
                    "The agent autonomously picks the appropriate tool based on the user intent, " +
                    "verifying that both registrations coexist without collision in the render registry.",
            },
        },
    },
    render: () => ({
        components: { MultiComponentDemo, StoryRuntimeProvider },
        data() {
            return { threadId: `story-genui-multi-${Date.now()}` };
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
            <MultiComponentDemo />
          </StoryRuntimeProvider>
        `,
    }),
};
