<script setup lang="ts">
/**
 * CopilotChatAudioRecorder — canvas waveform recorder component.
 *
 * Mirrors the React CopilotChatAudioRecorder: canvas-based waveform
 * visualization, imperative API via defineExpose().
 *
 * Exposed API (use templateRef to call):
 *   state: AudioRecorderState
 *   start(): Promise<void>
 *   stop(): Promise<Blob>
 *   dispose(): void
 */
import { onUnmounted, ref, watch } from "vue";
import type { AudioRecorderState } from "./CopilotChatAudioRecorder.types";

/** Error subclass so callers can instanceof-guard recorder failures. */
class AudioRecorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioRecorderError";
  }
}

// ---------------------------------------------------------------------------
// Recording state
// ---------------------------------------------------------------------------
const recorderState = ref<AudioRecorderState>("idle");
const mediaRecorderRef = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const streamRef = ref<MediaStream | null>(null);
const analyserRef = ref<AnalyserNode | null>(null);
const audioContextRef = ref<AudioContext | null>(null);
const animationIdRef = ref<number | null>(null);

// Canvas and waveform visualization state
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Amplitude history for scrolling waveform
let amplitudeHistory: number[] = [];
let scrollOffset = 0;
let smoothedAmplitude = 0;
let fadeOpacity = 0;

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
function cleanup() {
  if (animationIdRef.value !== null) {
    cancelAnimationFrame(animationIdRef.value);
    animationIdRef.value = null;
  }
  const mr = mediaRecorderRef.value;
  if (mr && mr.state !== "inactive") {
    try { mr.stop(); } catch { /* ignore */ }
  }
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((t) => t.stop());
    streamRef.value = null;
  }
  const ac = audioContextRef.value;
  if (ac && ac.state !== "closed") {
    ac.close().catch(() => { /* ignore */ });
    audioContextRef.value = null;
  }
  mediaRecorderRef.value = null;
  analyserRef.value = null;
  audioChunks.value = [];
  amplitudeHistory = [];
  scrollOffset = 0;
  smoothedAmplitude = 0;
  fadeOpacity = 0;
}

// ---------------------------------------------------------------------------
// start()
// ---------------------------------------------------------------------------
async function start(): Promise<void> {
  if (recorderState.value !== "idle") {
    throw new AudioRecorderError("Recorder is already active");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.value = stream;

    const audioContext = new AudioContext();
    audioContextRef.value = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.value = analyser;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
    const mr = new MediaRecorder(stream, options);
    mediaRecorderRef.value = mr;
    audioChunks.value = [];

    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) audioChunks.value.push(ev.data);
    };

    mr.start(100);
    recorderState.value = "recording";
  } catch (error) {
    cleanup();
    if (error instanceof Error && error.name === "NotAllowedError") {
      throw new AudioRecorderError("Microphone permission denied");
    }
    if (error instanceof Error && error.name === "NotFoundError") {
      throw new AudioRecorderError("No microphone found");
    }
    throw new AudioRecorderError(
      error instanceof Error ? error.message : "Failed to start recording",
    );
  }
}

// ---------------------------------------------------------------------------
// stop()
// ---------------------------------------------------------------------------
function stop(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mr = mediaRecorderRef.value;
    if (!mr || recorderState.value !== "recording") {
      reject(new AudioRecorderError("No active recording"));
      return;
    }

    recorderState.value = "processing";

    mr.onstop = () => {
      const mimeType = mr.mimeType || "audio/webm";
      const blob = new Blob(audioChunks.value, { type: mimeType });
      cleanup();
      recorderState.value = "idle";
      resolve(blob);
    };

    mr.onerror = () => {
      cleanup();
      recorderState.value = "idle";
      reject(new AudioRecorderError("Recording failed"));
    };

    mr.stop();
  });
}

// ---------------------------------------------------------------------------
// Canvas waveform drawing loop — mirrors React canvas rendering logic
// ---------------------------------------------------------------------------
function calculateAmplitude(dataArray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const sample = (dataArray[i]! / 128) - 1;
    sum += sample * sample;
  }
  return Math.sqrt(sum / dataArray.length);
}

function drawFrame() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const barWidth = 2;
  const barGap = 1;
  const barSpacing = barWidth + barGap;
  const scrollSpeed = 1 / 3;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  const maxBars = Math.floor(rect.width / barSpacing) + 2;

  if (analyserRef.value && recorderState.value === "recording") {
    if (amplitudeHistory.length === 0) {
      amplitudeHistory = new Array(maxBars).fill(0);
    }
    if (fadeOpacity < 1) fadeOpacity = Math.min(1, fadeOpacity + 0.03);

    scrollOffset += scrollSpeed;

    const bufferLength = analyserRef.value.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.value.getByteTimeDomainData(dataArray);
    const rawAmplitude = calculateAmplitude(dataArray);

    const attackSpeed = 0.12;
    const decaySpeed = 0.08;
    const speed = rawAmplitude > smoothedAmplitude ? attackSpeed : decaySpeed;
    smoothedAmplitude += (rawAmplitude - smoothedAmplitude) * speed;

    if (scrollOffset >= barSpacing) {
      scrollOffset -= barSpacing;
      amplitudeHistory.push(smoothedAmplitude);
      if (amplitudeHistory.length > maxBars) {
        amplitudeHistory = amplitudeHistory.slice(-maxBars);
      }
    }
  }

  ctx.clearRect(0, 0, rect.width, rect.height);

  const computedStyle = getComputedStyle(canvas);
  ctx.fillStyle = computedStyle.color;
  ctx.globalAlpha = fadeOpacity;

  const centerY = rect.height / 2;
  const maxAmplitude = rect.height / 2 - 2;
  const edgeFadeWidth = 12;

  if (amplitudeHistory.length > 0) {
    for (let i = 0; i < amplitudeHistory.length; i++) {
      const amplitude = amplitudeHistory[i] ?? 0;
      const scaledAmplitude = Math.min(amplitude * 4, 1);
      const barHeight = Math.max(2, scaledAmplitude * maxAmplitude * 2);
      const x = rect.width - (amplitudeHistory.length - i) * barSpacing - scrollOffset;
      const y = centerY - barHeight / 2;

      if (x + barWidth > 0 && x < rect.width) {
        let edgeOpacity = 1;
        if (x < edgeFadeWidth) {
          edgeOpacity = Math.max(0, x / edgeFadeWidth);
        } else if (x > rect.width - edgeFadeWidth) {
          edgeOpacity = Math.max(0, (rect.width - x) / edgeFadeWidth);
        }
        ctx.globalAlpha = fadeOpacity * edgeOpacity;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }
  }

  animationIdRef.value = requestAnimationFrame(drawFrame);
}

// Restart draw loop when recorderState changes (mirrors React useEffect([recorderState]))
watch(recorderState, () => {
  if (animationIdRef.value !== null) {
    cancelAnimationFrame(animationIdRef.value);
    animationIdRef.value = null;
  }
  animationIdRef.value = requestAnimationFrame(drawFrame);
}, { immediate: true });

onUnmounted(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Imperative API — Vue equivalent of forwardRef + useImperativeHandle
// ---------------------------------------------------------------------------
defineExpose({
  get state(): AudioRecorderState { return recorderState.value; },
  start,
  stop,
  dispose: cleanup,
});
</script>

<template>
  <div class="cpk-audio-recorder" data-copilotkit>
    <canvas ref="canvasRef" class="cpk-audio-recorder__canvas" />
  </div>
</template>
