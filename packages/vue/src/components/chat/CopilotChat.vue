<script setup lang="ts">
/**
 * CopilotChat — top-level chat orchestrator.
 * Runs useAgent + useSuggestions, passes state to CopilotChatView.
 * Mirrors the React CopilotChat.
 */
import { computed } from "vue";
import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
import type { Suggestion } from "@copilotkit/core";
import CopilotChatConfigurationProvider from "../../providers/CopilotChatConfigurationProvider.vue";
import CopilotChatView from "./CopilotChatView.vue";
import type { CopilotChatConfiguration } from "../../providers/keys";
import { useCopilotChat } from "../../composables/useCopilotChat";
import { useSuggestions } from "../../composables/useSuggestions";

const props = withDefaults(
  defineProps<{
    agentId?: string;
    threadId?: string;
    labels?: CopilotChatConfiguration["labels"];
    className?: string;
    throttleMs?: number;
    isModalDefaultOpen?: boolean;
    hideTextWhenCustomToolRendered?: boolean;
  }>(),
  {
    hideTextWhenCustomToolRendered: true,
  },
);

const { messages, sendMessage, stop, isLoading } = useCopilotChat({
  agentId: computed(() => props.agentId ?? DEFAULT_AGENT_ID) as any,
  throttleMs: computed(() => props.throttleMs) as any,
});

const { suggestions } = useSuggestions();

function handleSelectSuggestion(suggestion: Suggestion) {
  sendMessage(suggestion.message || suggestion.title);
}
</script>

<template>
  <CopilotChatConfigurationProvider :thread-id="threadId" :agent-id="agentId" :labels="labels"
    :is-modal-default-open="isModalDefaultOpen">
    <div class="cpk-chat" data-copilotkit :class="className">
      <CopilotChatView :messages="messages ?? []" :is-running="isLoading" :suggestions="suggestions ?? []"
        :input-placeholder="labels?.placeholder" :hide-text-when-custom-tool-rendered="hideTextWhenCustomToolRendered"
        @submit-message="sendMessage" @stop="stop" @select-suggestion="handleSelectSuggestion" />
    </div>
  </CopilotChatConfigurationProvider>
</template>
