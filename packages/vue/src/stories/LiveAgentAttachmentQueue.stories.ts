import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotChatAttachmentQueue from "../components/chat/CopilotChatAttachmentQueue.vue";
import type { Attachment } from "../composables/useAttachments";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Attachment Queue Component",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const seedAttachments: Attachment[] = [
    {
        id: "att-image",
        name: "diagram.png",
        mimeType: "image/png",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    },
    {
        id: "att-audio",
        name: "voice-note.webm",
        mimeType: "audio/webm",
        data: "data:audio/webm;base64,GkXfo0AgQoaBAULygQFC8oEEQvKBAULygQ==",
    },
    {
        id: "att-doc",
        name: "requirements.pdf",
        mimeType: "application/pdf",
        data: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr",
    },
];

const QueueComponentLiveContent = defineComponent({
    name: "QueueComponentLiveContent",
    components: { CopilotChat, CopilotChatAttachmentQueue },
    setup() {
        const attachments = ref<Attachment[]>([...seedAttachments]);

        const remove = (id: string) => {
            attachments.value = attachments.value.filter((item) => item.id !== id);
        };

        const reset = () => {
            attachments.value = [...seedAttachments];
        };

        return { attachments, remove, reset };
    },
    template: `
    <div style="display:grid;grid-template-columns:340px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">CopilotChatAttachmentQueue</h3>
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.45;">
          Dedicated queue component demo: remove items, reset queue, and verify preview rendering for mixed MIME types.
        </p>

        <CopilotChatAttachmentQueue :attachments="attachments" @remove="remove" />

        <div v-if="attachments.length === 0" style="font-size:12px;color:#94a3b8;">Queue is empty.</div>

        <button
          type="button"
          @click="reset"
          style="padding:8px 10px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer;font-size:12px;"
        >
          Reset sample queue
        </button>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + Queue Preview', placeholder: 'Ask about attachment handling patterns...' }"
        />
      </main>
    </div>
  `,
});

export const MixedQueuePreviewLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates queue-level interaction and mixed attachment rendering in a runtime-backed page. Use this to verify queue UX before wiring into full chat send flows.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, QueueComponentLiveContent },
        data() {
            return {
                threadId: `story-phase-c-queue-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <QueueComponentLiveContent />
      </StoryRuntimeProvider>
    `,
    }),
};
