<script setup lang="ts">
/**
 * CopilotChatInput — textarea + send/stop button, with optional transcribe mode.
 * Enter to send, Shift+Enter for newline. Mirrors the React CopilotChatInput.
 */
import { ref, computed, watch } from "vue";
import type { CopilotChatInputMode } from "./CopilotChatAudioRecorder.types";
import CopilotChatAudioRecorder from "./CopilotChatAudioRecorder.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    isRunning?: boolean;
    autoFocus?: boolean;
    attachmentsEnabled?: boolean;
    attachmentsAccept?: string;
    /** "input" = normal text mode, "transcribe" = recording, "processing" = transcribing */
    mode?: CopilotChatInputMode;
    /** Whether to show the mic button (transcription is supported + enabled) */
    showTranscription?: boolean;
  }>(),
  {
    placeholder: "Ask me anything...",
    disabled: false,
    isRunning: false,
    autoFocus: false,
    attachmentsEnabled: false,
    attachmentsAccept: "*/*",
    mode: "input",
    showTranscription: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [value: string];
  addFiles: [files: File[]];
  stop: [];
  startTranscribe: [];
  cancelTranscribe: [];
  finishTranscribeWithAudio: [blob: Blob];
}>();

const internalValue = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
type AudioRecorderHandle = {
  state: "idle" | "recording" | "processing";
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  dispose: () => void;
};

const audioRecorderRef = ref<AudioRecorderHandle | null>(null);

const value = computed({
  get() {
    return props.modelValue !== undefined ? props.modelValue : internalValue.value;
  },
  set(v: string) {
    internalValue.value = v;
    emit("update:modelValue", v);
  },
});

const canSend = computed(() => value.value.trim().length > 0);

function send() {
  const trimmed = value.value.trim();
  if (!trimmed) return;
  emit("submit", trimmed);
  value.value = "";
  textareaRef.value?.focus();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (props.isRunning) emit("stop");
    else send();
  }
}

function handleSendClick() {
  if (props.isRunning) emit("stop");
  else send();
}

function handleAddFileClick() {
  fileInputRef.value?.click();
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  if (files.length > 0) {
    emit("addFiles", files);
  }
  target.value = "";
}

function autoResize(e: Event) {
  const ta = e.target as HTMLTextAreaElement;
  ta.style.height = "auto";
  ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
}

// ---------------------------------------------------------------------------
// Transcription mode — mirrors React CopilotChatInput useEffect([mode])
// ---------------------------------------------------------------------------

// Start/stop recorder in sync with mode, including the first frame where recorder ref mounts.
watch(
  [() => props.mode, audioRecorderRef],
  ([newMode, recorder]) => {
    if (!recorder) return;

    if (newMode === "transcribe") {
      if (recorder.state === "idle") {
        recorder.start().catch(console.error);
      }
      return;
    }

    if (recorder.state === "recording") {
      recorder.stop().catch(console.error);
    }
  },
  { immediate: true, flush: "post" },
);

async function handleFinishTranscribe() {
  const recorder = audioRecorderRef.value;
  if (recorder && recorder.state === "recording") {
    try {
      const blob = await recorder.stop();
      emit("finishTranscribeWithAudio", blob);
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  }
}
</script>

<template>
  <div class="cpk-input" data-copilotkit>
    <input ref="fileInputRef" type="file" class="cpk-input__file" :accept="attachmentsAccept" multiple
      @change="handleFileInput">

    <!-- ── Normal input mode ────────────────────────────────────────────── -->
    <template v-if="mode === 'input'">
      <button v-if="attachmentsEnabled" class="cpk-input__attach" type="button" aria-label="Add attachment"
        title="Add attachment" @click="handleAddFileClick">
        +
      </button>

      <textarea ref="textareaRef" v-model="value" class="cpk-input__textarea" :placeholder="placeholder"
        :disabled="disabled" :autofocus="autoFocus" rows="1" @keydown="handleKeyDown" @input="autoResize" />

      <!-- Mic button — only when transcription is supported -->
      <button v-if="showTranscription" class="cpk-input__mic" type="button" aria-label="Start voice input"
        title="Start voice input" @click="emit('startTranscribe')">
        <!-- Mic SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      <button class="cpk-input__send" type="button" :disabled="isRunning ? false : !canSend || disabled"
        :title="isRunning ? 'Stop' : 'Send'" :aria-label="isRunning ? 'Stop generation' : 'Send message'"
        @click="handleSendClick">
        <!-- stop icon when running -->
        <svg v-if="isRunning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
        <!-- send arrow otherwise -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </template>

    <!-- ── Transcribe / processing mode ─────────────────────────────────── -->
    <template v-else>
      <!-- Cancel button -->
      <button class="cpk-input__transcribe-cancel" type="button" aria-label="Cancel recording" title="Cancel recording"
        @click="emit('cancelTranscribe')">
        <!-- X icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- Waveform canvas fills the middle -->
      <CopilotChatAudioRecorder ref="audioRecorderRef" class="cpk-input__waveform" />

      <!-- Finish / processing indicator -->
      <button v-if="mode === 'transcribe'" class="cpk-input__transcribe-finish" type="button"
        aria-label="Finish recording" title="Finish recording" @click="handleFinishTranscribe">
        <!-- Check icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
      <span v-else class="cpk-input__transcribe-spinner" aria-label="Transcribing...">
        <!-- Loader icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cpk-spin">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </span>
    </template>
  </div>
</template>
