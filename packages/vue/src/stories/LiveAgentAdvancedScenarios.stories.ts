import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, provide, ref, computed, watch } from "vue";
import { CopilotKitCore } from "@copilotkit/core";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotSidebar from "../components/chat/CopilotSidebar.vue";
import CopilotChatView from "../components/chat/CopilotChatView.vue";
import CopilotChatInput from "../components/chat/CopilotChatInput.vue";
import { CopilotKitKey, type CopilotKitContext } from "../providers/keys";
import { useFrontendTool } from "../composables/useFrontendTool";
import { useAgent } from "../composables/useAgent";
import { useCopilotChat } from "../composables/useCopilotChat";
import { useSuggestions } from "../composables/useSuggestions";

const StoryRuntimeProvider = defineComponent({
    name: "StoryRuntimeProvider",
    props: {
        runtimeUrl: { type: String, required: true },
        threadId: { type: String, default: undefined },
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
    title: "Scenarios/Advanced Agent Features",
    tags: ["live-agent"],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "Live advanced feature demonstrations with real agent runtime.",
            },
        },
    },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Story 1: Shared AG-UI State
 * Demonstrates shared app state synced through AG-UI agent state.
 * Try: "What is the current page?" or "What is my username?"
 */
const ContextSharingContent = defineComponent({
    components: { CopilotChat },
    props: {
        threadId: { type: String, required: true },
    },
    setup(props) {
        const currentPage = ref("Dashboard");
        const userName = ref("Alex");
        const isApplyingRemoteState = ref(false);
        const { agent, state, isRunning } = useAgent({
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

        return { currentPage, userName, stateJson, isRunning, threadId: props.threadId };
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
          💡 This state is synced through AG-UI shared state. Try asking:
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
    render: () => ({
        components: { StoryRuntimeProvider, ContextSharingContent },
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

/**
 * Story 2: Frontend Tools
 * Demonstrates useFrontendTool — agent can call client-side functions.
 * Try: "What's the counter value?" or "Increment the counter by 5"
 */
const ToolsContent = defineComponent({
    components: { CopilotChat },
    setup() {
        const counter = ref(0);
        const lastToolCall = ref<string | null>(null);

        // Register read_counter tool
        useFrontendTool({
            name: "read_counter",
            description: "Get the current counter value",
            agentId: "my_agent",
            handler: async () => {
                lastToolCall.value = `✓ read_counter() → ${counter.value}`;
                return { value: counter.value };
            },
        });

        // Register increment_counter tool
        useFrontendTool({
            name: "increment_counter",
            description: "Increment the counter by a specified amount (default 1)",
            agentId: "my_agent",
            handler: async ({ amount = 1 }: { amount?: number } = {}) => {
                counter.value += amount;
                lastToolCall.value = `✓ increment_counter(${amount}) → ${counter.value}`;
                return { newValue: counter.value };
            },
        });

        // Register reset_counter tool
        useFrontendTool({
            name: "reset_counter",
            description: "Reset the counter to zero",
            agentId: "my_agent",
            handler: async () => {
                counter.value = 0;
                lastToolCall.value = "✓ reset_counter() → 0";
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
          💡 Ask the agent to:
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
    render: () => ({
        components: { StoryRuntimeProvider, ToolsContent },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-frontend-tools">
        <ToolsContent />
      </StoryRuntimeProvider>
    `,
    }),
};

/**
 * Story 3: Multi-Thread Chat
 * Three independent conversation threads (A, B, C).
 * Switch between threads to maintain separate histories and contexts.
 */
export const MultiThreadChat: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        data() {
            return {
                activeThread: "a" as "a" | "b" | "c",
                threadLabels: {
                    a: "General Chat",
                    b: "Proverbs Only",
                    c: "Questions",
                },
            };
        },
        template: `
          <div style="display: flex; height: 100vh; flex-direction: column;">
            <div style="display: flex; gap: 8px; padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
              <button
                v-for="id in ['a', 'b', 'c']"
                :key="id"
                @click="activeThread = id"
                :style="{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: activeThread === id ? '#0066cc' : '#ddd',
                  color: activeThread === id ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: activeThread === id ? 'bold' : 'normal',
                }"
              >
                Thread {{ id.toUpperCase() }}: {{ threadLabels[id] }}
              </button>
            </div>
            <StoryRuntimeProvider :runtime-url="'/api/copilotkit'" :thread-id="'story-thread-' + activeThread">
              <main style="flex: 1; overflow: hidden;">
                <CopilotChat
                  :key="activeThread"
                  agent-id="my_agent"
                  :labels="{ 
                    title: 'Thread ' + activeThread.toUpperCase(),
                    placeholder: 'Continue this thread conversation...' 
                  }"
                />
              </main>
            </StoryRuntimeProvider>
          </div>
        `,
    }),
};

/**
 * Story 4: Agent State Inspection
 * Demonstrates low-level useAgent hook with reactive state inspection.
 * Shows messages, state, running status in real-time.
 */
const StateInspectionContent = defineComponent({
    components: { CopilotChatView, CopilotChatInput },
    setup() {
        const { agent, messages, state, isRunning } = useAgent({
            agentId: "my_agent",
            threadId: "story-agent-state",
        });

        const { sendMessage } = useCopilotChat({
            agentId: "my_agent",
            threadId: "story-agent-state",
        });

        const stateJson = computed(() => {
            if (!state.value) return "{}";
            return JSON.stringify(state.value, null, 2);
        });

        const agentInfo = computed(() => ({
            agentId: agent.value?.agentId || "unknown",
            threadId: agent.value?.threadId || "none",
            messageCount: messages.value?.length || 0,
            isRunning: isRunning.value,
        }));

        return { messages, isRunning, stateJson, agentInfo, sendMessage };
    },
    template: `
    <div style="display: flex; height: 100vh; gap: 16px; padding: 16px;">
      <div style="flex: 1; display: flex; flex-direction: column;">
        <h3 style="margin: 0 0 12px 0;">Chat Interface</h3>
        <div style="flex: 1; border: 1px solid #ddd; border-radius: 4px; padding: 12px; overflow-y: auto; background: #fafafa; margin-bottom: 12px;">
          <CopilotChatView :messages="messages || []" :is-running="isRunning" />
        </div>
        <CopilotChatInput @submit-message="sendMessage" />
      </div>
      <div style="width: 320px; background: #f5f5f5; padding: 16px; border-radius: 4px; border: 1px solid #ddd; overflow-y: auto; font-family: monospace; font-size: 12px;">
        <h4 style="margin: 0 0 8px 0; font-family: sans-serif;">Agent Info</h4>
        <pre style="margin: 0 0 16px 0; background: white; padding: 8px; border-radius: 2px; border: 1px solid #ddd; overflow-x: auto;">{{ JSON.stringify(agentInfo, null, 2) }}</pre>
        <h4 style="margin: 0 0 8px 0; font-family: sans-serif;">Reactive State</h4>
        <pre style="margin: 0; background: white; padding: 8px; border-radius: 2px; border: 1px solid #ddd; overflow-x: auto; max-height: 250px; overflow-y: auto;">{{ stateJson }}</pre>
      </div>
    </div>
  `,
});

export const AgentStateInspection: Story = {
    render: () => ({
        components: { StoryRuntimeProvider, StateInspectionContent },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-agent-state">
        <StateInspectionContent />
      </StoryRuntimeProvider>
    `,
    }),
};

/**
 * Story 5: Sidebar Integration
 * CopilotSidebar used as a collapsible help panel.
 * Opens/closes independently from main content.
 */
export const SidebarAndChatCombo: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotSidebar,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-sidebar">
            <div style="height: 100vh; padding: 24px; background: #f9f9f9;">
              <h1>Main Application Content</h1>
              <p style="max-width: 600px; line-height: 1.6; color: #666;">
                Click the chat icon in the bottom-right corner to open the AI assistant sidebar. 
                You can have conversations with the agent without interrupting your main workflow. 
                The sidebar maintains conversation history and can be closed/reopened as needed.
              </p>
              <div style="margin-top: 24px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #ddd;">
                <h3>Features</h3>
                <ul style="color: #666;">
                  <li>Chat with AI agent</li>
                  <li>Receive contextual suggestions</li>
                  <li>Get help without leaving the page</li>
                </ul>
              </div>
              <CopilotSidebar
                agent-id="my_agent"
                :default-open="false"
                :width="460"
                :labels="{ 
                  title: 'AI Assistant', 
                  placeholder: 'Ask for help...' 
                }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 6: Suggestions Demo
 * Minimal, compact chat interface ideal for embedded scenarios.
 * Uses smaller font sizes and reduced padding.
 */
export const SuggestionsDemo: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-compact">
            <div style="width: 350px; height: 500px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <CopilotChat
                agent-id="my_agent"
                :labels="{ 
                  title: 'Quick Chat', 
                  placeholder: 'Ask...' 
                }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 7: Error Handling
 * Two-column layout with main chat and information panel.
 * Demonstrates integrating CopilotChat within a larger UI.
 */
export const ErrorHandling: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-split">
            <div style="display: flex; height: 100vh;">
              <div style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid #ddd;">
                <CopilotChat
                  agent-id="my_agent"
                  :labels="{ 
                    title: 'Chat', 
                    placeholder: 'Ask a question...' 
                  }"
                />
              </div>
              <aside style="width: 280px; padding: 20px; background: #f5f5f5; overflow-y: auto;">
                <h3>Information Panel</h3>
                <div style="font-size: 13px; color: #666; line-height: 1.6;">
                  <p><strong>Chat Topics:</strong></p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>General questions</li>
                    <li>Proverbs &amp; wisdom</li>
                    <li>Context-aware advice</li>
                  </ul>
                  <p style="margin-top: 16px; padding: 12px; background: white; border-radius: 4px; border-left: 4px solid #0066cc;">
                    💡 <strong>Tip:</strong> Ask the agent about specific topics, and it will provide contextual responses.
                  </p>
                </div>
              </aside>
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 8: Minimal Composable UI
 * Maximalist chat experience covering entire viewport.
 * Best for dedicated chat applications.
 */
export const MinimalComposableUI: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-fullscreen">
            <CopilotChat
              agent-id="my_agent"
              :labels="{ 
                title: 'AI Assistant', 
                placeholder: 'How can I help you today?' 
              }"
            />
          </StoryRuntimeProvider>
        `,
    }),
};
