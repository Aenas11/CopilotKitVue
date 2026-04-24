import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotChatAttachmentRenderer from "../components/chat/CopilotChatAttachmentRenderer.vue";
import type { Attachment } from "../composables/useAttachments";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Attachment Renderer Component",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const imageAttachment: Attachment = {
    id: "renderer-image",
    name: "preview.png",
    mimeType: "image/png",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
};

const audioAttachment: Attachment = {
    id: "renderer-audio",
    name: "memo.webm",
    mimeType: "audio/webm",
    data: "data:audio/webm;base64,GkXfo0AgQoaBAULygQFC8oEEQvKBAULygQ==",
};

const videoAttachment: Attachment = {
    id: "renderer-video",
    name: "walkthrough.webm",
    mimeType: "video/webm",
    data: "data:video/webm;base64,GkXfo0AgQoaBAULygQFC8oEEQvKBAULygQ==",
};

const documentAttachment: Attachment = {
    id: "renderer-doc",
    name: "design-spec.pdf",
    mimeType: "application/pdf",
    data: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr",
};

const RendererComponentLiveContent = defineComponent({
    name: "RendererComponentLiveContent",
    components: { CopilotChat, CopilotChatAttachmentRenderer },
    setup() {
        return {
            audioAttachment,
            documentAttachment,
            imageAttachment,
            videoAttachment,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:360px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">CopilotChatAttachmentRenderer</h3>
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.45;">
          Dedicated renderer demo for image, audio, video, and document attachments.
        </p>

        <CopilotChatAttachmentRenderer :attachment="imageAttachment" />
        <CopilotChatAttachmentRenderer :attachment="audioAttachment" />
        <CopilotChatAttachmentRenderer :attachment="videoAttachment" />
        <CopilotChatAttachmentRenderer :attachment="documentAttachment" />
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + Attachment Renderer', placeholder: 'Ask what each file type should render as...' }"
        />
      </main>
    </div>
  `,
});

export const RendererVariantsLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates per-type visual output for the attachment renderer while preserving a real runtime-backed page context.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, RendererComponentLiveContent },
        data() {
            return {
                threadId: `story-phase-c-renderer-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <RendererComponentLiveContent />
      </StoryRuntimeProvider>
    `,
    }),
};
