<script setup lang="ts">
/**
 * CopilotChatSuggestionPill — single suggestion button.
 * Mirrors the React CopilotChatSuggestionPill exactly.
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    isLoading?: boolean;
    disabled?: boolean;
    icon?: string; // SVG string or emoji
    className?: string;
  }>(),
  { isLoading: false, disabled: false },
);

const emit = defineEmits<{ click: [label: string] }>();

const isDisabled = computed(() => props.isLoading || props.disabled);
</script>

<template>
  <button data-copilotkit data-testid="copilot-suggestion" class="cpk-suggestion-pill"
    :class="[props.className, { 'is-loading': props.isLoading }]" type="button" :disabled="isDisabled"
    :aria-busy="props.isLoading || undefined" @click="!isDisabled && emit('click', props.label)">
    <span v-if="props.isLoading" class="cpk-suggestion-pill__icon" aria-hidden="true">
      <svg class="cpk-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="14" height="14">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
    <span v-else-if="props.icon" class="cpk-suggestion-pill__icon" aria-hidden="true" v-html="props.icon" />
    <span class="cpk-suggestion-pill__label">{{ label }}</span>
  </button>
</template>
