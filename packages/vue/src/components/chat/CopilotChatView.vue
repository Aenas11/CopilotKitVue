<script setup lang="ts">
/**
 * CopilotChatView — scrollable message list + input bar + suggestions.
 * Mirrors the React CopilotChatView (Phase A implementation).
 */
import { ref, watch, nextTick, onMounted } from "vue";
import type { Message } from "@ag-ui/client";
import type { Suggestion } from "@copilotkit/core";
import CopilotChatMessageView from "./CopilotChatMessageView.vue";
import CopilotChatInput from "./CopilotChatInput.vue";
import CopilotChatSuggestionView from "./CopilotChatSuggestionView.vue";

const props = withDefaults(
  defineProps<{
    messages?: Message[];
    isRunning?: boolean;
    suggestions?: Suggestion[];
    inputPlaceholder?: string;
    loadingMessage?: string;
    emptyStateComponent?: boolean; // slot activator
    headerComponent?: boolean;
  }>(),
  {
    messages: () => [],
    isRunning: false,
    suggestions: () => [],
    inputPlaceholder: "Ask me anything...",
    loadingMessage: "Thinking...",
  },
);

const emit = defineEmits<{
  submitMessage: [text: string];
  stop: [];
  selectSuggestion: [suggestion: Suggestion, index: number];
}>();

const scrollRef = ref<HTMLDivElement | null>(null);
const atBottom = ref(true);

function scrollToBottom(behavior: ScrollBehavior = "smooth") {
  const el = scrollRef.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior });
}

function handleScroll() {
  const el = scrollRef.value;
  if (!el) return;
  const threshold = 80;
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

watch(
  () => props.messages,
  () => {
    if (atBottom.value) {
      nextTick(() => scrollToBottom("smooth"));
    }
  },
  { deep: true },
);

onMounted(() => scrollToBottom("instant"));
</script>

<template>
  <div class="cpk-chat-view" data-copilotkit>
    <!-- optional header slot -->
    <slot name="header" />

    <!-- scrollable message area (position:relative for the scroll-down btn) -->
    <div class="cpk-chat-view__scroll-wrapper">
      <div ref="scrollRef" class="cpk-chat-view__messages" @scroll="handleScroll">
        <!-- empty state -->
        <div v-if="!messages.length && !isRunning" class="cpk-chat-view__empty">
          <slot name="empty">
            <p class="cpk-chat-view__empty-text">How can I help you today?</p>
          </slot>
        </div>

        <CopilotChatMessageView :messages="messages" :is-running="isRunning" />
      </div>

      <!-- scroll-to-bottom button -->
      <button v-if="!atBottom" type="button" class="cpk-scroll-bottom" aria-label="Scroll to bottom"
        @click="scrollToBottom('smooth')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- suggestion pills -->
    <CopilotChatSuggestionView :suggestions="suggestions"
      @select-suggestion="(suggestion, index) => emit('selectSuggestion', suggestion, index)" />

    <!-- input bar -->
    <CopilotChatInput :placeholder="inputPlaceholder" :is-running="isRunning" @submit="emit('submitMessage', $event)"
      @stop="emit('stop')" />
  </div>
</template>
