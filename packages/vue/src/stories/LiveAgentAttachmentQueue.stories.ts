import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Attachment Queue Component",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const QueueComponentLiveContent = defineComponent({
    name: "QueueComponentLiveContent",
    components: { CopilotChat },
    template: `
    <div style="display:grid;grid-template-columns:360px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">CopilotChatAttachmentQueue</h3>
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.45;">
          Agent-integrated queue demo: use the chat attach button to add files and verify the queue rendered by CopilotChat before sending.
        </p>
        <div style="padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#475569;font-size:12px;line-height:1.45;display:grid;gap:6px;">
          <div><strong>How to use:</strong></div>
          <div>1. Click the + button in chat input and select one or more files.</div>
          <div>2. Confirm items appear in the attachment queue above the input.</div>
          <div>3. Remove an item from the queue and verify it disappears.</div>
          <div>4. Send a message and inspect runtime payload to confirm attachment parts are included.</div>
        </div>
        <div style="padding:10px;border:1px solid #bae6fd;border-radius:10px;background:#eff6ff;color:#0c4a6e;font-size:12px;line-height:1.45;">
          This scenario validates real queue wiring inside CopilotChat (not a standalone mock queue state).
        </div>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :attachments="{ enabled: true, accept: '*/*' }"
          :labels="{ title: 'Live Agent + Queue Integration', placeholder: 'Attach files, then ask the agent to summarize them...' }"
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
                    "Why needed: validates end-to-end attachment queue behavior through CopilotChat in a runtime-backed scenario. Use this to verify add/remove UX and confirm attachments flow into actual chat send payloads.",
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
