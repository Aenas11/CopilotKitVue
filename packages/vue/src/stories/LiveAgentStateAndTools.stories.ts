import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent, ref, watch } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { useAgent } from "../composables/useAgent";
import { useFrontendTool } from "../composables/useFrontendTool";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Advanced Scenarios/State and Tools",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const ContextSharingContent = defineComponent({
    components: { CopilotChat },
    props: {
        threadId: { type: String, required: true },
    },
    setup(props) {
        const currentPage = ref("Dashboard");
        const userName = ref("Alex");
        const isApplyingRemoteState = ref(false);
        const { agent, state } = useAgent({
            agentId: "my_agent",
            threadId: props.threadId,
        });

        const pushStateToAgent = () => {
            if (!agent.value || isApplyingRemoteState.value) {
                return;
            }

            const existingState = (state.value ?? {}) as Record<string, unknown>;
            agent.value.setState({
                ...existingState,
                currentPage: currentPage.value,
                userName: userName.value,
            });
        };

        watch(
            agent,
            (resolvedAgent) => {
                if (!resolvedAgent) {
                    return;
                }

                const existingState = (resolvedAgent.state ?? {}) as Record<string, unknown>;
                const hasSharedState =
                    typeof existingState.currentPage === "string" ||
                    typeof existingState.userName === "string";

                if (!hasSharedState) {
                    pushStateToAgent();
                }
            },
            { immediate: true },
        );

        watch([currentPage, userName], () => {
            pushStateToAgent();
        });

        watch(
            state,
            (nextState) => {
                const sharedState = (nextState ?? {}) as Record<string, unknown>;
                const nextPage = typeof sharedState.currentPage === "string" ? sharedState.currentPage : null;
                const nextUser = typeof sharedState.userName === "string" ? sharedState.userName : null;

                if (!nextPage && !nextUser) {
                    return;
                }

                isApplyingRemoteState.value = true;

                if (nextPage && nextPage !== currentPage.value) {
                    currentPage.value = nextPage;
                }

                if (nextUser && nextUser !== userName.value) {
                    userName.value = nextUser;
                }

                isApplyingRemoteState.value = false;
            },
            { deep: true },
        );

        const stateJson = computed(() => {
            if (!state.value) {
                return "{}";
            }

            return JSON.stringify(state.value, null, 2);
        });

        return { currentPage, stateJson, threadId: props.threadId, userName };
    },
    template: `
      <div style="display: flex; height: 100vh;">
        <aside style="width: 200px; padding: 16px; background: #f5f5f5; border-right: 1px solid #ddd;">
          <h3 style="margin: 0 0 16px;">Shared State</h3>
          <div style="margin: 12px 0;">
            <label style="display: block; font-weight: bold; margin-bottom: 4px;">User:</label>
            <input v-model="userName" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          <div style="margin: 12px 0;">
            <label style="display: block; font-weight: bold; margin-bottom: 4px;">Current Page:</label>
            <select v-model="currentPage" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
              <option>Dashboard</option>
              <option>Settings</option>
              <option>Profile</option>
              <option>Billing</option>
            </select>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 16px;">
            This state is synced through AG-UI shared state. Try asking:
            <br/>"What page am I on?"
            <br/>"Who am I?"
            <br/>"Summarize my current state"
          </p>
          <div style="margin-top: 16px;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px;">Agent State</div>
            <pre style="margin: 0; background: white; padding: 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 11px; max-height: 180px; overflow: auto;">{{ stateJson }}</pre>
          </div>
        </aside>
        <main style="flex: 1;">
          <CopilotChat
            agent-id="my_agent"
            :thread-id="threadId"
            :labels="{ title: 'Context-Aware Chat', placeholder: 'Ask about your state...' }"
          />
        </main>
      </div>
    `,
});

export const ContextSharingChat: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: verifies two-way state synchronization between UI and agent context. " +
                    "Use this to confirm that agent answers reflect current app state and that remote state updates propagate back safely.",
            },
        },
    },
    render: () => ({
        components: { ContextSharingContent, StoryRuntimeProvider },
        data() {
            return {
                threadId: `story-context-sharing-agui-${Date.now()}`,
            };
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
            <ContextSharingContent :thread-id="threadId" />
          </StoryRuntimeProvider>
        `,
    }),
};

const ToolsContent = defineComponent({
    components: { CopilotChat },
    setup() {
        const counter = ref(0);
        const lastToolCall = ref<string | null>(null);

        useFrontendTool({
            name: "read_counter",
            description: "Get the current counter value",
            agentId: "my_agent",
            handler: async () => {
                lastToolCall.value = `read_counter() -> ${counter.value}`;
                return { value: counter.value };
            },
        });

        useFrontendTool({
            name: "increment_counter",
            description: "Increment the counter by a specified amount (default 1)",
            agentId: "my_agent",
            handler: async ({ amount = 1 }: { amount?: number } = {}) => {
                counter.value += amount;
                lastToolCall.value = `increment_counter(${amount}) -> ${counter.value}`;
                return { newValue: counter.value };
            },
        });

        useFrontendTool({
            name: "reset_counter",
            description: "Reset the counter to zero",
            agentId: "my_agent",
            handler: async () => {
                counter.value = 0;
                lastToolCall.value = "reset_counter() -> 0";
                return { value: 0 };
            },
        });

        return { counter, lastToolCall };
    },
    template: `
      <div style="display: flex; height: 100vh;">
        <aside style="width: 240px; padding: 16px; background: #f5f5f5; border-right: 1px solid #ddd; overflow-y: auto;">
          <h3 style="margin: 0 0 16px;">Tool Demo</h3>
          <div style="font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; padding: 16px; background: white; border-radius: 8px;">
            {{ counter }}
          </div>
          <div style="display: grid; gap: 8px; margin: 16px 0;">
            <button @click="counter++" style="padding: 8px; cursor: pointer; background: #ddd; border: none; border-radius: 4px;">+1</button>
            <button @click="counter -= 1" style="padding: 8px; cursor: pointer; background: #ddd; border: none; border-radius: 4px;">-1</button>
            <button @click="counter = 0" style="padding: 8px; cursor: pointer; background: #ddd; border: none; border-radius: 4px;">Reset</button>
          </div>
          <div v-if="lastToolCall" style="margin-top: 16px; padding: 10px; background: #e8f4f8; border-left: 4px solid #0066cc; border-radius: 4px; font-size: 12px; font-family: monospace; color: #0066cc;">
            {{ lastToolCall }}
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 16px; line-height: 1.4;">
            Ask the agent to:
            <br/>"What's the value?"
            <br/>"Increment to 10"
            <br/>"Reset the counter"
          </p>
        </aside>
        <main style="flex: 1;">
          <CopilotChat
            agent-id="my_agent"
            :labels="{ title: 'Tool-Powered Chat', placeholder: 'Ask agent to modify state...' }"
          />
        </main>
      </div>
    `,
});

export const FrontendToolsChat: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates frontend tool registration and side effects in a live loop. " +
                    "Use this to confirm the agent can call client tools reliably and UI state updates are visible immediately.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, ToolsContent },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-frontend-tools">
            <ToolsContent />
          </StoryRuntimeProvider>
        `,
    }),
};