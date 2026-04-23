import type { Message } from "@ag-ui/client";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotChatView from "../components/chat/CopilotChatView.vue";
import { useAgent } from "../composables/useAgent";
import { useCopilotKit } from "../composables/useCopilotKit";
import { useThreads, type Thread } from "../composables/useThreads";
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

// ── Thread List Manager — useThreads composable ───────────────────────────────

const ThreadListManagerContent = defineComponent({
    components: { CopilotChat },
    setup() {
        const agentId = "my_agent";
        const activeThreadId = ref<string | null>(null);
        const renameTarget = ref<string | null>(null);
        const renameValue = ref("");
        const confirmDeleteId = ref<string | null>(null);

        const {
            threads,
            isLoading,
            error,
            hasMoreThreads,
            isFetchingMoreThreads,
            fetchMoreThreads,
            renameThread,
            archiveThread,
            deleteThread,
        } = useThreads({ agentId });

        const visibleThreads = computed(() =>
            threads.value.filter((t: Thread) => !t.archived),
        );

        const startRename = (thread: Thread) => {
            renameTarget.value = thread.id;
            renameValue.value = thread.name ?? "";
        };

        const commitRename = async () => {
            if (renameTarget.value && renameValue.value.trim()) {
                await renameThread(renameTarget.value, renameValue.value.trim());
            }
            renameTarget.value = null;
            renameValue.value = "";
        };

        const cancelRename = () => {
            renameTarget.value = null;
            renameValue.value = "";
        };

        const confirmDelete = (id: string) => {
            confirmDeleteId.value = id;
        };

        const commitDelete = async () => {
            if (confirmDeleteId.value) {
                await deleteThread(confirmDeleteId.value);
                if (activeThreadId.value === confirmDeleteId.value) {
                    activeThreadId.value = null;
                }
            }
            confirmDeleteId.value = null;
        };

        const cancelDelete = () => {
            confirmDeleteId.value = null;
        };

        const formatDate = (iso: string) => {
            try {
                return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            } catch {
                return iso;
            }
        };

        return {
            agentId,
            activeThreadId,
            renameTarget,
            renameValue,
            confirmDeleteId,
            visibleThreads,
            isLoading,
            error,
            hasMoreThreads,
            isFetchingMoreThreads,
            fetchMoreThreads,
            archiveThread,
            startRename,
            commitRename,
            cancelRename,
            confirmDelete,
            commitDelete,
            cancelDelete,
            formatDate,
        };
    },
    template: `
      <div style="display: flex; height: 100vh; font-family: system-ui, sans-serif;">

        <!-- Thread list sidebar -->
        <aside style="width: 280px; display: flex; flex-direction: column; background: #f8fafc; border-right: 1px solid #e2e8f0;">
          <div style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">Threads</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">via useThreads({ agentId: "my_agent" })</div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" style="padding: 20px 16px; text-align: center; color: #94a3b8; font-size: 13px;">
            Loading threads…
          </div>

          <!-- Error -->
          <div v-else-if="error" style="padding: 14px 16px; background: #fef2f2; border-left: 3px solid #f87171; margin: 8px; border-radius: 6px; font-size: 12px; color: #991b1b;">
            {{ error.message }}
          </div>

          <!-- Empty -->
          <div v-else-if="visibleThreads.length === 0" style="padding: 20px 16px; text-align: center; color: #cbd5e1; font-size: 13px;">
            No threads yet.<br />Start a conversation to create one.
          </div>

          <!-- Thread rows -->
          <div v-else style="flex: 1; overflow-y: auto;">
            <div
              v-for="thread in visibleThreads"
              :key="thread.id"
              @click="activeThreadId = thread.id"
              :style="{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                background: activeThreadId === thread.id ? '#eff6ff' : 'transparent',
                borderLeft: activeThreadId === thread.id ? '3px solid #3b82f6' : '3px solid transparent',
              }"
            >
              <!-- Rename inline editor -->
              <div v-if="renameTarget === thread.id" @click.stop style="display: flex; gap: 4px;">
                <input
                  v-model="renameValue"
                  @keydown.enter="commitRename"
                  @keydown.esc="cancelRename"
                  autofocus
                  style="flex: 1; font-size: 12px; padding: 3px 6px; border: 1px solid #93c5fd; border-radius: 4px; outline: none;"
                />
                <button @click="commitRename" style="font-size: 11px; padding: 2px 6px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✓</button>
                <button @click="cancelRename" style="font-size: 11px; padding: 2px 6px; background: #e2e8f0; color: #475569; border: none; border-radius: 4px; cursor: pointer;">✕</button>
              </div>

              <!-- Normal row -->
              <div v-else>
                <div style="font-size: 13px; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ thread.name || '(Untitled)' }}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                  <span style="font-size: 11px; color: #94a3b8;">{{ formatDate(thread.updatedAt) }}</span>
                  <div style="display: flex; gap: 4px;" @click.stop>
                    <button
                      @click="startRename(thread)"
                      title="Rename"
                      style="font-size: 11px; padding: 2px 5px; background: transparent; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; color: #64748b;"
                    >✎</button>
                    <button
                      @click="archiveThread(thread.id)"
                      title="Archive"
                      style="font-size: 11px; padding: 2px 5px; background: transparent; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; color: #64748b;"
                    >🗃</button>
                    <button
                      @click="confirmDelete(thread.id)"
                      title="Delete"
                      style="font-size: 11px; padding: 2px 5px; background: transparent; border: 1px solid #fecaca; border-radius: 4px; cursor: pointer; color: #dc2626;"
                    >🗑</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination footer -->
          <div v-if="hasMoreThreads || isFetchingMoreThreads" style="padding: 10px 14px; border-top: 1px solid #e2e8f0;">
            <button
              @click="fetchMoreThreads()"
              :disabled="isFetchingMoreThreads"
              style="width: 100%; font-size: 12px; padding: 6px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; color: #475569;"
            >
              {{ isFetchingMoreThreads ? 'Loading…' : 'Load more threads' }}
            </button>
          </div>
        </aside>

        <!-- Delete confirmation modal -->
        <div
          v-if="confirmDeleteId"
          style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100;"
          @click.self="cancelDelete"
        >
          <div style="background: white; border-radius: 12px; padding: 24px; max-width: 340px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
            <h4 style="margin: 0 0 8px; font-size: 15px; color: #0f172a;">Delete thread?</h4>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5;">
              This action is permanent and cannot be undone.
            </p>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button @click="cancelDelete" style="padding: 7px 14px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; color: #475569;">Cancel</button>
              <button @click="commitDelete" style="padding: 7px 14px; border: none; border-radius: 6px; background: #dc2626; color: white; cursor: pointer; font-size: 13px; font-weight: 600;">Delete</button>
            </div>
          </div>
        </div>

        <!-- Chat panel -->
        <main style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
          <div v-if="!activeThreadId" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 8px;">
            <div style="font-size: 32px;">💬</div>
            <div style="font-size: 14px; font-weight: 500;">Select a thread to continue</div>
            <div style="font-size: 12px;">or start a new conversation from the sidebar</div>
          </div>
          <CopilotChat
            v-else
            :key="activeThreadId"
            :agent-id="agentId"
            :thread-id="activeThreadId"
            :labels="{ title: 'Thread Chat', placeholder: 'Continue this conversation…' }"
            style="flex: 1;"
          />
        </main>
      </div>
    `,
});

export const ThreadListManager: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates useThreads end-to-end with a real platform. " +
                    "Shows live thread listing, rename, archive, and delete mutations against the running runtime. " +
                    "Selecting a thread opens a CopilotChat for that threadId, verifying that useThreads and " +
                    "per-thread chat coexist correctly in the same view.",
            },
        },
    },
    render: () => ({
        components: { ThreadListManagerContent, StoryRuntimeProvider },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit">
            <ThreadListManagerContent />
          </StoryRuntimeProvider>
        `,
    }),
};