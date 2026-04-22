<script setup lang="ts">
/**
 * CopilotChatReasoningMessage — collapsible chain-of-thought message.
 * Mirrors the React CopilotChatReasoningMessage.
 */
import { ref, computed, watch, onUnmounted } from "vue";
import type { ReasoningMessage, Message } from "@ag-ui/core";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false });

const props = withDefaults(
  defineProps<{
    message: ReasoningMessage;
    messages?: Message[];
    isRunning?: boolean;
  }>(),
  { messages: () => [], isRunning: false },
);

const isExpanded = ref(false);
const elapsed = ref(0);
const startTime = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const isLatest = computed(
  () => props.messages[props.messages.length - 1]?.id === props.message.id,
);
const isStreaming = computed(() => props.isRunning && isLatest.value);

watch(isStreaming, (streaming) => {
  if (streaming && startTime.value === null) {
    startTime.value = Date.now();
    isExpanded.value = true;
    timer = setInterval(() => {
      elapsed.value = (Date.now() - (startTime.value ?? Date.now())) / 1000;
    }, 200);
  } else if (!streaming && timer !== null) {
    clearInterval(timer);
    timer = null;
    elapsed.value = (Date.now() - (startTime.value ?? Date.now())) / 1000;
    isExpanded.value = false;
  }
}, { immediate: true });

onUnmounted(() => { if (timer) clearInterval(timer); });

function formatDuration(s: number): string {
  if (s < 1) return "a few seconds";
  if (s < 60) return `${Math.round(s)} seconds`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec === 0 ? `${m}m` : `${m}m ${sec}s`;
}

const renderedContent = computed(() => md.render(props.message.content ?? ""));
</script>

<template>
  <div data-copilotkit class="cpk-message cpk-message--reasoning">
    <button class="cpk-reasoning__header" type="button" :aria-expanded="isExpanded" @click="isExpanded = !isExpanded">
      <svg class="cpk-reasoning__chevron" :class="{ 'is-expanded': isExpanded }" xmlns="http://www.w3.org/2000/svg"
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
      <span v-if="isStreaming" class="cpk-reasoning__label">
        Thinking<span class="cpk-ellipsis">...</span>
        <span class="cpk-reasoning__elapsed">({{ formatDuration(elapsed) }})</span>
      </span>
      <span v-else class="cpk-reasoning__label">
        Thought for {{ formatDuration(elapsed) }}
      </span>
    </button>
    <div v-if="isExpanded" class="cpk-reasoning__content cpk-prose" v-html="renderedContent" />
  </div>
</template>
