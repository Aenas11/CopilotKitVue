import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import type { AttachmentsConfig } from "@copilotkit/shared";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Use Attachments",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const basicAttachmentsConfig: AttachmentsConfig = {
    enabled: true,
};

const imagesOnlyConfig: AttachmentsConfig = {
    enabled: true,
    accept: "image/*",
    maxSize: 2 * 1024 * 1024,
};

const copilotManagedConfigContent = defineComponent({
    name: "CopilotManagedConfigContent",
    components: { CopilotChat },
    props: {
        attachmentsConfig: {
            type: Object as () => AttachmentsConfig,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        guidance: {
            type: String,
            required: true,
        },
        configLabel: {
            type: String,
            required: true,
        },
    },
    template: `
    <div style="display:grid;grid-template-columns:360px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">{{ title }}</h3>
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.45;">{{ guidance }}</p>
        <div style="padding:10px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;font-size:12px;color:#1e3a8a;line-height:1.45;">
          This story uses <strong>AttachmentsConfig</strong> on <strong>CopilotChat</strong>.
          <div style="margin-top:6px;font-family:ui-monospace, SFMono-Regular, Consolas, monospace;white-space:pre-wrap;">{{ configLabel }}</div>
        </div>
        <div style="padding:10px;border:1px solid #fde68a;border-radius:8px;background:#fffbeb;font-size:12px;color:#92400e;line-height:1.45;">
          Compatibility note: in the local examples stack, the C# agent host normalizes multimodal array content into text before binding the request model. This keeps attachment submits working while preserving React-parity payload shape from CopilotChat.
        </div>
        <ol style="margin:0;padding-left:18px;font-size:12px;color:#334155;display:grid;gap:4px;line-height:1.45;">
          <li>Click the attachment <strong>+</strong> button in chat input.</li>
          <li>Select files allowed by the current config.</li>
          <li>Send a prompt, for example: <em>"Summarize my attachments."</em></li>
          <li>Verify agent response and queue behavior for this config variant.</li>
        </ol>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :attachments="attachmentsConfig"
          :labels="{ title, placeholder: 'Attach files, then ask the agent about them...' }"
        />
      </main>
    </div>
  `,
});

const customUploadConfigContent = defineComponent({
    name: "CustomUploadConfigContent",
    components: { CopilotChat },
    setup() {
        const uploadEvents = ref<string[]>([]);
        const uploadErrors = ref<string[]>([]);

        const customUploadConfig: AttachmentsConfig = {
            enabled: true,
            accept: "image/*,application/pdf",
            maxSize: 3 * 1024 * 1024,
            onUpload: async (file) => {
                uploadEvents.value = [
                    `onUpload: ${file.name} (${Math.round(file.size / 1024)}KB)`,
                    ...uploadEvents.value,
                ].slice(0, 6);

                // Demo variant: return URL source to show AttachmentsConfig.onUpload customization.
                return {
                    type: "url",
                    value: URL.createObjectURL(file),
                    mimeType: file.type,
                    metadata: {
                        provider: "storybook-demo",
                        originalName: file.name,
                    },
                };
            },
            onUploadFailed: ({ reason, message }) => {
                uploadErrors.value = [`${reason}: ${message}`, ...uploadErrors.value].slice(0, 6);
            },
        };

        const failureDemoConfig: AttachmentsConfig = {
            enabled: true,
            accept: "image/*",
            maxSize: 64 * 1024,
            onUploadFailed: ({ reason, message }) => {
                uploadErrors.value = [`${reason}: ${message}`, ...uploadErrors.value].slice(0, 6);
            },
        };

        const mode = ref<"custom-upload" | "failure-demo">("custom-upload");

        const toggleMode = () => {
            mode.value = mode.value === "custom-upload" ? "failure-demo" : "custom-upload";
        };

        const activeConfig = () =>
            mode.value === "custom-upload" ? customUploadConfig : failureDemoConfig;

        const configLabel = () => {
            if (mode.value === "custom-upload") {
                return "attachments={{ enabled: true, accept: 'image/*,application/pdf', maxSize: 3MB, onUpload, onUploadFailed }}";
            }
            return "attachments={{ enabled: true, accept: 'image/*', maxSize: 64KB, onUploadFailed }}";
        };

        return {
            activeConfig,
            configLabel,
            mode,
            toggleMode,
            uploadErrors,
            uploadEvents,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:380px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">AttachmentsConfig advanced variants</h3>
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.45;">
          Toggle between custom upload and failure-demo modes to see how <strong>AttachmentsConfig</strong>
          changes CopilotChat behavior.
        </p>

        <button
          type="button"
          @click="toggleMode"
          style="padding:8px 10px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer;font-size:12px;"
        >
          Switch mode (current: {{ mode }})
        </button>

        <div style="padding:10px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;font-size:12px;color:#1e3a8a;line-height:1.45;">
          <div style="font-family:ui-monospace, SFMono-Regular, Consolas, monospace;white-space:pre-wrap;">{{ configLabel() }}</div>
        </div>

        <div style="font-size:12px;color:#334155;line-height:1.45;">
          Upload callbacks:
          <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px;">
            <li v-for="entry in uploadEvents" :key="entry">{{ entry }}</li>
            <li v-if="uploadEvents.length === 0" style="color:#94a3b8;">No onUpload calls yet.</li>
          </ul>
        </div>

        <div style="font-size:12px;color:#991b1b;line-height:1.45;">
          Upload failures:
          <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px;">
            <li v-for="entry in uploadErrors" :key="entry">{{ entry }}</li>
            <li v-if="uploadErrors.length === 0" style="color:#94a3b8;">No failures yet.</li>
          </ul>
        </div>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :attachments="activeConfig()"
          :labels="{ title: 'Live Agent + AttachmentsConfig Variants', placeholder: 'Attach files, then ask the agent about them...' }"
        />
      </main>
    </div>
  `,
});

export const CopilotChatAttachmentsBasic: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "How to use: this variant exposes AttachmentsConfig as attachments={{ enabled: true }}. Use + in chat input, add any file, then ask the agent to summarize attachments. Note: the local C# examples host normalizes array content to text for compatibility.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, CopilotManagedConfigContent: copilotManagedConfigContent },
        data() {
            return {
                threadId: `story-phase-c-copilotchat-attachments-basic-${Date.now()}`,
                attachmentsConfig: basicAttachmentsConfig,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <CopilotManagedConfigContent
          :attachments-config="attachmentsConfig"
          title="CopilotChat + AttachmentsConfig (Basic)"
          guidance="Variant 1: simplest enablement using attachments={{ enabled: true }}."
          config-label="attachments={{ enabled: true }}"
        />
      </StoryRuntimeProvider>
    `,
    }),
};

export const CopilotChatAttachmentsImagesOnly: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "How to use: variant with accept + maxSize. Attach only images up to 2MB, then send message. Non-matching files trigger onUploadFailed behavior. Note: the local C# examples host normalizes array content to text for compatibility.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, CopilotManagedConfigContent: copilotManagedConfigContent },
        data() {
            return {
                threadId: `story-phase-c-copilotchat-attachments-images-${Date.now()}`,
                attachmentsConfig: imagesOnlyConfig,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <CopilotManagedConfigContent
          :attachments-config="attachmentsConfig"
          title="CopilotChat + AttachmentsConfig (Images Only)"
          guidance="Variant 2: accept filter + max file size using AttachmentsConfig." 
          config-label="attachments={{ enabled: true, accept: 'image/*', maxSize: 2 * 1024 * 1024 }}"
        />
      </StoryRuntimeProvider>
    `,
    }),
};

export const CopilotChatAttachmentsCustomUploadAndFailures: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "How to use: variant exposing AttachmentsConfig.onUpload and onUploadFailed. Switch modes to test custom URL upload vs strict failure handling. Note: the local C# examples host normalizes array content to text for compatibility.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, CustomUploadConfigContent: customUploadConfigContent },
        data() {
            return {
                threadId: `story-phase-c-copilotchat-attachments-custom-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <CustomUploadConfigContent />
      </StoryRuntimeProvider>
    `,
    }),
};
