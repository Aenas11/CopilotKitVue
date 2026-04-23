<script setup lang="ts">
/**
 * CopilotChatMessageView — dispatches each message to the correct renderer.
 * Mirrors the React CopilotChatMessageView.
 */
import type { Message, AssistantMessage, UserMessage, ReasoningMessage } from "@ag-ui/core";
import CopilotChatAssistantMessage from "./CopilotChatAssistantMessage.vue";
import CopilotChatUserMessage from "./CopilotChatUserMessage.vue";
import CopilotChatReasoningMessage from "./CopilotChatReasoningMessage.vue";

withDefaults(
  defineProps<{
    messages: Message[];
    isRunning?: boolean;
    hideTextWhenCustomToolRendered?: boolean;
  }>(),
  {
    messages: () => [],
    isRunning: false,
    hideTextWhenCustomToolRendered: true,
  },
);
</script>

<template>
  <div class="cpk-message-list">
    <template v-for="message in messages" :key="message.id">
      <CopilotChatAssistantMessage v-if="message.role === 'assistant'" :message="(message as AssistantMessage)"
        :messages="messages" :is-running="isRunning"
        :hide-text-when-custom-tool-rendered="hideTextWhenCustomToolRendered" />
      <CopilotChatUserMessage v-else-if="message.role === 'user'" :message="(message as UserMessage)" />
      <CopilotChatReasoningMessage v-else-if="message.role === 'reasoning'" :message="(message as ReasoningMessage)"
        :messages="messages" :is-running="isRunning" />
      <!-- tool messages are intentionally not rendered directly -->
    </template>

    <!-- typing indicator while running and last message is from user -->
    <div v-if="isRunning && messages.length && messages[messages.length - 1]?.role === 'user'"
      class="cpk-message cpk-message--assistant">
      <span class="cpk-message__thinking" aria-label="Thinking" />
    </div>
  </div>
</template>
