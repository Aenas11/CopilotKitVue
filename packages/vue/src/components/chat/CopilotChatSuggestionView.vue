<script setup lang="ts">
/**
 * CopilotChatSuggestionView — suggestion strip.
 * Mirrors the React CopilotChatSuggestionView.
 */
import type { Suggestion } from "@copilotkit/core";
import CopilotChatSuggestionPill from "./CopilotChatSuggestionPill.vue";

const props = defineProps<{
  suggestions: Suggestion[];
  loadingIndexes?: ReadonlyArray<number>;
}>();

const emit = defineEmits<{ selectSuggestion: [suggestion: Suggestion, index: number] }>();

function isLoading(index: number): boolean {
  return (
    (props.loadingIndexes?.includes(index) ?? false) ||
    (props.suggestions[index]?.isLoading === true)
  );
}
</script>

<template>
  <div v-if="suggestions.length > 0" data-copilotkit data-testid="copilot-suggestions" class="cpk-suggestions">
    <CopilotChatSuggestionPill v-for="(suggestion, i) in suggestions" :key="`${suggestion.title}-${i}`"
      :label="suggestion.title" :is-loading="isLoading(i)" :class-name="suggestion.className"
      @click="emit('selectSuggestion', suggestion, i)" />
  </div>
</template>
