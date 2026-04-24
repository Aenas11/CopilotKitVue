import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotChatAudioRecorder from "../components/chat/CopilotChatAudioRecorder.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Phase C/Audio Recorder Component",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const AudioRecorderLiveContent = defineComponent({
    name: "AudioRecorderLiveContent",
    components: { CopilotChat, CopilotChatAudioRecorder },
    setup() {
        const recorderState = ref("idle");
        const transcripts = ref<string[]>([]);
        const error = ref<string | null>(null);

        const onTranscript = (text: string) => {
            transcripts.value = [text, ...transcripts.value].slice(0, 5);
            error.value = null;
        };

        const onError = (message: string) => {
            error.value = message;
        };

        const onStateChange = (state: string) => {
            recorderState.value = state;
        };

        return {
            error,
            onError,
            onStateChange,
            onTranscript,
            recorderState,
            transcripts,
        };
    },
    template: `
    <div style="display:grid;grid-template-columns:340px minmax(0,1fr);height:100vh;">
      <aside style="border-right:1px solid #e2e8f0;background:#f8fafc;padding:14px 12px;display:flex;flex-direction:column;gap:10px;">
        <h3 style="margin:0;font-size:15px;">CopilotChatAudioRecorder</h3>
        <p style="margin:0;color:#475569;font-size:12px;line-height:1.45;">
          Start and stop recording to capture a transcript payload. Then send a prompt to the live agent using the captured note.
        </p>

        <CopilotChatAudioRecorder
          @transcript="onTranscript"
          @state-change="onStateChange"
          @error="onError"
        />

        <div style="font-size:12px;color:#334155;">Recorder state: <strong>{{ recorderState }}</strong></div>

        <div v-if="error" style="font-size:12px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px;">
          {{ error }}
        </div>

        <div style="font-size:12px;color:#475569;">
          Recent transcript payloads:
          <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px;">
            <li v-for="item in transcripts" :key="item">{{ item }}</li>
          </ul>
        </div>
      </aside>

      <main style="min-width:0;">
        <CopilotChat
          agent-id="my_agent"
          :labels="{ title: 'Live Agent + Voice Capture', placeholder: 'Ask: summarize my latest voice note...' }"
        />
      </main>
    </div>
  `,
});

export const VoiceCaptureLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates microphone lifecycle, recorder state transitions, and transcript event emission in a runtime-backed workflow page.",
            },
        },
    },
    render: () => ({
        components: { StoryRuntimeProvider, AudioRecorderLiveContent },
        data() {
            return {
                threadId: `story-phase-c-audio-${Date.now()}`,
            };
        },
        template: `
      <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
        <AudioRecorderLiveContent />
      </StoryRuntimeProvider>
    `,
    }),
};
