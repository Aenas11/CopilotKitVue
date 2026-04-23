<script setup lang="ts">
/**
 * CopilotChatToolCallsView — renders the tool call list inside an assistant message.
 * Phase A: shows built-in tool-call badges (name + running/done status).
 * Phase B will replace the inner rendering with useRenderToolCall custom slots.
 */
import { computed, defineComponent } from "vue";
import type { AssistantMessage, Message, ToolMessage } from "@ag-ui/core";
import { parseJson, partialJSONParse } from "@copilotkit/shared";
import { inject } from "vue";
import { CopilotKitKey, CopilotChatConfigurationKey } from "../../providers/keys";
import {
  getToolCallRenderer,
  type ToolCallRenderStatus,
} from "../../adapters/toolCallRenderRegistry";

const props = withDefaults(
  defineProps<{
    message: AssistantMessage;
    messages?: Message[];
    isRunning?: boolean;
  }>(),
  {
    messages: () => [],
    isRunning: false,
  },
);

const copilotKitContext = inject(CopilotKitKey, null);
const chatConfig = inject(CopilotChatConfigurationKey, null);

const RenderToolContent = defineComponent({
  name: "RenderToolContent",
  props: {
    content: {
      type: null,
      required: false,
      default: null,
    },
  },
  setup(props) {
    return () => props.content as any;
  },
});

interface ResolvedToolCall {
  id: string;
  name: string;
  isDone: boolean;
  customContent?: unknown;
}

const resolvedToolCalls = computed<ResolvedToolCall[]>(() => {
  if (!props.message.toolCalls?.length) return [];

  // Prefer the agentId from the chat configuration provider (set by CopilotChat
  // via the agent-id prop). Fall back to whatever the message carries, then
  // undefined so the registry wildcard fallback can still match.
  const resolvedAgentId = chatConfig?.agentId
    ?? (props.message as AssistantMessage & { agentId?: string }).agentId;

  return props.message.toolCalls.map((tc) => {
    const toolMessage = props.messages.find(
      (m): m is ToolMessage => m.role === "tool" && (m as ToolMessage).toolCallId === tc.id,
    );

    const renderer = copilotKitContext
      ? getToolCallRenderer(copilotKitContext.copilotkit, {
        name: tc.function?.name ?? tc.id,
        agentId: resolvedAgentId,
      })
      : undefined;

    const status: ToolCallRenderStatus = toolMessage
      ? "complete"
      : props.isRunning
        ? "in-progress"
        : "executing";

    const rawResult = typeof toolMessage?.content === "string" ? toolMessage.content : undefined;

    const customContent = renderer?.render({
      name: tc.function?.name ?? tc.id,
      args: partialJSONParse(tc.function?.arguments ?? ""),
      status,
      result: rawResult ? parseJson(rawResult, rawResult) : rawResult,
    });

    return {
      id: tc.id,
      name: tc.function?.name ?? tc.id,
      isDone: !!toolMessage,
      customContent,
    };
  });
});
</script>

<template>
  <div v-if="resolvedToolCalls.length" class="cpk-tool-calls">
    <template v-for="tc in resolvedToolCalls" :key="tc.id">
      <RenderToolContent v-if="tc.customContent" :content="tc.customContent" />

      <div v-else class="cpk-tool-call" :class="{ 'cpk-tool-call--done': tc.isDone }">
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
    </template>
  </div>
</template>
