import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Audio Recorder (Integrated)",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Demonstrates the integrated voice input flow.
 *
 * The mic button appears inside the chat input bar (bottom right of the
 * textarea). Clicking it enters "transcribe" mode which shows the canvas
 * waveform and record/cancel controls directly in the input area —
 * matching the React CopilotChatInput architecture.
 *
 * When the user finishes recording, the audio blob is POSTed to
 * `/api/copilotkit/transcribe` and the resulting text is automatically
 * submitted as a message.
 *
 * NOTE: The mic button is only visible when:
 *   - `MediaRecorder` is available in the browser (Chrome/Edge/Firefox)
 *   - A runtimeUrl is configured in the provider (transcription endpoint)
 *
 * TECHNICAL DEBT:
 *   - Transcription currently depends on runtime-side OpenAI-compatible wiring.
 *   - Foundry + Microsoft Agent Framework-only deployments may require a
 *     dedicated Azure-native transcription service integration.
 *   - This will be aligned in a follow-up task.
 */
const AudioRecorderIntegratedContent = defineComponent({
    name: "AudioRecorderIntegratedContent",
    components: { CopilotChat },
    setup() {
        const threadId = ref(`story-audio-${Date.now()}`);
        return { threadId };
    },
    template: `
    <div style="height:100vh;display:flex;flex-direction:column;">
      <CopilotChat
        agent-id="my_agent"
        :thread-id="threadId"
        :labels="{
          title: 'Live Agent + Voice Input',
          placeholder: 'Type a message, or click the mic to speak...'
        }"
        style="flex:1;"
      />
    </div>
  `,
});

export const VoiceInputIntegrated: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Validates the integrated voice input pipeline: mic button inside the input bar → canvas waveform → transcription API → auto-submitted message. Matches the React CopilotChatInput architecture where the recorder lives inside the input, not as a separate sidebar component. Technical debt: transcription is currently wired through an OpenAI-compatible runtime path and will be aligned with Azure Foundry + Microsoft Agent Framework-native transcription in a follow-up.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, AudioRecorderIntegratedContent },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :force-audio-file-transcription-enabled="true">
        <AudioRecorderIntegratedContent />
      </StoryRuntimeProvider>
    `,
    }),
};
