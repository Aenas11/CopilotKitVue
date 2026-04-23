import type { Message } from "@ag-ui/client";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotChatView from "../components/chat/CopilotChatView.vue";
import { useAgent } from "../composables/useAgent";
import { useCopilotKit } from "../composables/useCopilotKit";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Advanced Scenarios/Threads and Debugging",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const MultiThreadChat: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates thread isolation and continuity. " +
                    "Use this to ensure switching threads does not leak context or messages between conversations.",
            },
        },
    },
    render: () => ({
        components: {
            CopilotChat,
            StoryRuntimeProvider,
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

const StateInspectionContent = defineComponent({
    components: { CopilotChatView },
    props: {
        threadId: { type: String, required: true },
    },
    setup(props) {
        const { copilotkit } = useCopilotKit();
        const { agent, messages, state, isRunning } = useAgent({
            agentId: "my_agent",
            threadId: props.threadId,
        });

        const sendMessage = async (text: string) => {
            const resolvedAgent = agent.value;
            if (!resolvedAgent) {
                return;
            }

            resolvedAgent.messages = [
                ...(resolvedAgent.messages ?? []),
                {
                    role: "user",
                    content: text,
                    id: crypto.randomUUID?.() ?? `msg-${Date.now()}`,
                } as Message,
            ];

            await copilotkit.runAgent({
                agent: resolvedAgent,
                forwardedProps: { ...(copilotkit.properties ?? {}) },
            });
        };

        const stop = () => {
            const resolvedAgent = agent.value;
            if (!resolvedAgent) {
                return;
            }

            copilotkit.stopAgent({ agent: resolvedAgent });
        };

        const stateJson = computed(() => {
            if (!state.value) {
                return "{}";
            }

            return JSON.stringify(state.value, null, 2);
        });

        const agentInfo = computed(() => ({
            agentId: agent.value?.agentId || "unknown",
            threadId: agent.value?.threadId || "none",
            messageCount: messages.value?.length || 0,
            isRunning: isRunning.value,
        }));

        return { agentInfo, isRunning, messages, sendMessage, stateJson, stop };
    },
    template: `
      <div style="display: flex; height: 100vh; gap: 16px; padding: 16px;">
        <div style="flex: 1; display: flex; flex-direction: column;">
          <h3 style="margin: 0 0 12px 0;">Chat Interface</h3>
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 4px; padding: 12px; overflow-y: auto; background: #fafafa; margin-bottom: 12px;">
            <CopilotChatView
              :messages="messages || []"
              :is-running="isRunning"
              @submit-message="sendMessage"
              @stop="stop"
            />
          </div>
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
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: gives low-level visibility into useAgent behavior in real time. " +
                    "Use this to debug running state transitions, message updates, and state payload changes.",
            },
        },
    },
    render: () => ({
        components: { StateInspectionContent, StoryRuntimeProvider },
        data() {
            return {
                threadId: `story-agent-state-${Date.now()}`,
            };
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
            <StateInspectionContent :thread-id="threadId" />
          </StoryRuntimeProvider>
        `,
    }),
};