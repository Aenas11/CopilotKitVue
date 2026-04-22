<script setup lang="ts">
/**
 * CopilotChatToolCallsView — renders the tool call list inside an assistant message.
 * Phase A: shows built-in tool-call badges (name + running/done status).
 * Phase B will replace the inner rendering with useRenderToolCall custom slots.
 */
import { computed } from "vue";
import type { AssistantMessage, Message, ToolMessage } from "@ag-ui/core";

const props = withDefaults(
  defineProps<{
    message: AssistantMessage;
    messages?: Message[];
  }>(),
  { messages: () => [] },
);

interface ResolvedToolCall {
  id: string;
  name: string;
  isDone: boolean;
  result?: string;
}

const resolvedToolCalls = computed<ResolvedToolCall[]>(() => {
  if (!props.message.toolCalls?.length) return [];
  return props.message.toolCalls.map((tc) => {
    const toolMessage = props.messages.find(
      (m): m is ToolMessage => m.role === "tool" && (m as ToolMessage).toolCallId === tc.id,
    );
    return {
      id: tc.id,
      name: tc.function?.name ?? tc.id,
      isDone: !!toolMessage,
      result: toolMessage?.content as string | undefined,
    };
  });
});
</script>

<template>
  <div v-if="resolvedToolCalls.length" class="cpk-tool-calls">
    <div v-for="tc in resolvedToolCalls" :key="tc.id" class="cpk-tool-call"
      :class="{ 'cpk-tool-call--done': tc.isDone }">
      <!-- spinner while running -->
      <svg v-if="!tc.isDone" class="cpk-tool-call__icon cpk-spin" xmlns="http://www.w3.org/2000/svg" width="12"
        height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <!-- check when done -->
      <svg v-else class="cpk-tool-call__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span class="cpk-tool-call__name">{{ tc.name }}</span>
    </div>
  </div>
</template>
