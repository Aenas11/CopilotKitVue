import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { useThreads, type Thread } from "../composables/useThreads";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Use Threads",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const ThreadContinuityContent = defineComponent({
    name: "ThreadContinuityContent",
    components: { CopilotChat },
    setup() {
        const active = ref<"alpha" | "beta" | "gamma">("alpha");

        return { active };
    },
    template: `
    <div style="display:flex;flex-direction:column;height:100vh;">
      <div style="display:flex;gap:8px;padding:12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
        <button type="button" @click="active='alpha'">Thread Alpha</button>
        <button type="button" @click="active='beta'">Thread Beta</button>
        <button type="button" @click="active='gamma'">Thread Gamma</button>
      </div>
      <main style="flex:1;min-height:0;">
        <CopilotChat
          :key="active"
          agent-id="my_agent"
          :thread-id="'phase-c-' + active"
          :labels="{ title: 'Thread ' + active.toUpperCase(), placeholder: 'Ask something and switch threads...' }"
        />
      </main>
    </div>
  `,
});

const ThreadCrudContent = defineComponent({
    name: "ThreadCrudContent",
    setup() {
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
        } = useThreads({ agentId: "my_agent" });

        const visible = computed(() => threads.value.filter((item: Thread) => !item.archived));

        const renameFirst = async () => {
            const target = visible.value[0];
            if (!target) return;
            await renameThread(target.id, `${target.name ?? "Thread"} (renamed)`);
        };

        const archiveFirst = async () => {
            const target = visible.value[0];
            if (!target) return;
            await archiveThread(target.id);
        };

        const deleteFirst = async () => {
            const target = visible.value[0];
            if (!target) return;
            await deleteThread(target.id);
        };

        return {
            archiveFirst,
            deleteFirst,
            error,
            fetchMoreThreads,
            hasMoreThreads,
            isFetchingMoreThreads,
            isLoading,
            renameFirst,
            visible,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:360px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">useThreads CRUD</h3>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.45;">
          Live demo of thread listing + CRUD helpers. On local examples runtime this may return 422 because full thread APIs require Intelligence platform.
        </p>

        <div v-if="isLoading" style="font-size:12px;color:#64748b;">Loading threads...</div>

        <div v-else-if="error" style="font-size:12px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px;line-height:1.45;">
          {{ error.message }}
        </div>

        <ul v-else style="margin:0;padding-left:18px;font-size:12px;color:#334155;display:grid;gap:4px;">
          <li v-for="thread in visible" :key="thread.id">
            {{ thread.name || thread.id }}
          </li>
        </ul>

        <div style="display:grid;gap:8px;grid-template-columns:1fr 1fr;">
          <button type="button" @click="renameFirst">Rename first</button>
          <button type="button" @click="archiveFirst">Archive first</button>
          <button type="button" @click="deleteFirst">Delete first</button>
          <button type="button" :disabled="!hasMoreThreads || isFetchingMoreThreads" @click="fetchMoreThreads">Fetch more</button>
        </div>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + Threads API', placeholder: 'Ask anything while validating thread controls...' }"
        />
      </main>
    </div>
  `,
});

export const ThreadContinuityLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates thread-id based isolation and continuity against the real examples agent runtime.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, ThreadContinuityContent },
        data() {
            return {
                threadId: `story-phase-c-threads-continuity-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <ThreadContinuityContent />
      </StoryRuntimeProvider>
    `,
    }),
};

export const ThreadCrudPlatformGatedLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: demonstrates useThreads CRUD surfaces with explicit platform-gated expectations. This story still runs against the real examples stack and reports platform limitations inline.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, ThreadCrudContent },
        data() {
            return {
                threadId: `story-phase-c-threads-crud-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <ThreadCrudContent />
      </StoryRuntimeProvider>
    `,
    }),
};
