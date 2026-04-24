<script setup lang="ts">
/** CopilotChatAudioRecorder — voice input button. Phase C. */
import { computed, onUnmounted, ref } from "vue";

type RecorderState = "idle" | "recording" | "processing" | "error";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    lang?: string;
  }>(),
  {
    disabled: false,
    lang: "en-US",
  },
);

const emit = defineEmits<{
  transcript: [text: string];
  error: [message: string];
  stateChange: [state: RecorderState];
}>();

const state = ref<RecorderState>("idle");
const mediaRecorder = ref<MediaRecorder | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const chunks = ref<Blob[]>([]);
const startedAt = ref<number | null>(null);

const isBusy = computed(() => state.value === "recording" || state.value === "processing");

async function toggleRecording() {
  if (props.disabled || state.value === "processing") {
    return;
  }

  if (state.value === "recording") {
    stopRecording();
    return;
  }

  await startRecording();
}

async function startRecording() {
  try {
    state.value = "processing";
    emit("stateChange", state.value);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunks.value = [];
    startedAt.value = Date.now();
    mediaStream.value = stream;
    mediaRecorder.value = recorder;

    recorder.addEventListener("dataavailable", onDataAvailable);
    recorder.addEventListener("stop", onRecorderStop);
    recorder.start();

    state.value = "recording";
    emit("stateChange", state.value);
  } catch (error) {
    handleError(error);
  }
}

function stopRecording() {
  const recorder = mediaRecorder.value;
  if (!recorder || recorder.state !== "recording") {
    return;
  }

  state.value = "processing";
  emit("stateChange", state.value);
  recorder.stop();
}

function onDataAvailable(event: BlobEvent) {
  if (event.data && event.data.size > 0) {
    chunks.value = [...chunks.value, event.data];
  }
}

function onRecorderStop() {
  const durationMs = startedAt.value ? Date.now() - startedAt.value : 0;
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
  const blob = new Blob(chunks.value, { type: "audio/webm" });

  emit(
    "transcript",
    `Voice note captured (${durationSeconds}s, ${Math.round(blob.size / 1024)}KB).`,
  );

  teardownRecorder();
  state.value = "idle";
  emit("stateChange", state.value);
}

function teardownRecorder() {
  if (mediaRecorder.value) {
    mediaRecorder.value.removeEventListener("dataavailable", onDataAvailable);
    mediaRecorder.value.removeEventListener("stop", onRecorderStop);
    mediaRecorder.value = null;
  }

  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop());
    mediaStream.value = null;
  }

  chunks.value = [];
  startedAt.value = null;
}

function handleError(error: unknown) {
  teardownRecorder();
  state.value = "error";
  emit("stateChange", state.value);

  const message = error instanceof Error ? error.message : "Unable to access microphone";
  emit("error", message);

  state.value = "idle";
  emit("stateChange", state.value);
}

onUnmounted(() => {
  teardownRecorder();
});
</script>
<template>
  <button class="copilotkit-audio-recorder" type="button" :disabled="disabled || state === 'processing'"
    :aria-label="state === 'recording' ? 'Stop recording' : 'Start recording'" @click="toggleRecording">
    <slot :state="state" :is-busy="isBusy">
      <span v-if="state === 'recording'">Stop</span>
      <span v-else-if="state === 'processing'">Processing...</span>
      <span v-else>Record</span>
    </slot>
  </button>
</template>
