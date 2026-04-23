<script setup lang="ts">
/**
 * CopilotChatAssistantMessage — renders an assistant message with Markdown
 * and an action toolbar (copy, thumbs up/down).
 * Mirrors the React CopilotChatAssistantMessage.
 */
import { computed, inject, ref } from "vue";
import MarkdownIt from "markdown-it";
import type { AssistantMessage, Message } from "@ag-ui/core";
import CopilotChatToolCallsView from "./CopilotChatToolCallsView.vue";
import { CopilotKitKey, CopilotChatConfigurationKey } from "../../providers/keys";
import { getToolCallRenderer } from "../../adapters/toolCallRenderRegistry";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const props = withDefaults(
  defineProps<{
    message: AssistantMessage;
    messages?: Message[];
    isRunning?: boolean;
    toolbarVisible?: boolean;
    hideTextWhenCustomToolRendered?: boolean;
  }>(),
  {
    messages: () => [],
    isRunning: false,
    toolbarVisible: true,
    hideTextWhenCustomToolRendered: true,
  },
);

const emit = defineEmits<{
  thumbsUp: [message: AssistantMessage];
  thumbsDown: [message: AssistantMessage];
  regenerate: [message: AssistantMessage];
}>();

const copied = ref(false);
const copilotKitContext = inject(CopilotKitKey, null);
const chatConfig = inject(CopilotChatConfigurationKey, null);

const renderedContent = computed(() =>
  md.render(props.message.content ?? ""),
);

const hasCustomToolContent = computed(() => {
  if (!copilotKitContext || !props.message.toolCalls?.length) return false;
  const agentId = chatConfig?.agentId;
  return props.message.toolCalls.some((tc) => {
    const name = tc.function?.name ?? tc.id;
    return !!getToolCallRenderer(copilotKitContext.copilotkit, { name, agentId });
  });
});

const shouldHideMarkdownForToolMessage = computed(
  () => props.hideTextWhenCustomToolRendered && hasCustomToolContent.value,
);

const shouldRenderMarkdown = computed(
  () => !shouldHideMarkdownForToolMessage.value && !!props.message.content,
);

const isLatestMessage = computed(
  () => props.messages[props.messages.length - 1]?.id === props.message.id,
);

// Mirror React: don't show toolbar on the currently-streaming latest message
const shouldShowToolbar = computed(
  () =>
    props.toolbarVisible &&
    !shouldHideMarkdownForToolMessage.value &&
    !!(props.message.content?.trim()) &&
    !(props.isRunning && isLatestMessage.value),
);

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.message.content ?? "");
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // clipboard not available
  }
}
</script>

<template>
  <div data-copilotkit class="cpk-message cpk-message--assistant">
    <!-- streaming indicator when no content yet -->
    <span v-if="isRunning && isLatestMessage && !message.content" class="cpk-message__thinking" />

    <!-- rendered markdown -->
    <div v-else-if="shouldRenderMarkdown" class="cpk-message__content cpk-prose" v-html="renderedContent" />

    <!-- tool calls (badge list) -->
    <CopilotChatToolCallsView :message="message" :messages="messages" :is-running="isRunning" />

    <!-- toolbar: copy / thumbs / regenerate (hidden on streaming latest) -->
    <div v-if="shouldShowToolbar" class="cpk-message__toolbar">
      <button class="cpk-btn-icon" type="button" :title="copied ? 'Copied!' : 'Copy'"
        :aria-label="copied ? 'Copied!' : 'Copy message'" @click="copyContent">
        <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
      <button class="cpk-btn-icon" type="button" title="Thumbs up" aria-label="Thumbs up"
        @click="emit('thumbsUp', message)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 10v12" />
          <path
            d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </button>
      <button class="cpk-btn-icon" type="button" title="Thumbs down" aria-label="Thumbs down"
        @click="emit('thumbsDown', message)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 14V2" />
          <path
            d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </button>
      <button class="cpk-btn-icon" type="button" title="Regenerate" aria-label="Regenerate response"
        @click="emit('regenerate', message)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      </button>
    </div>
  </div>
</template>
