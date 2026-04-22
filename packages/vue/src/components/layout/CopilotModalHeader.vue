<script setup lang="ts">
/**
 * CopilotModalHeader — header bar with title and close button.
 * Reads title from CopilotChatConfigurationKey and calls setModalOpen(false) on close.
 * Mirrors the React CopilotModalHeader.
 */
import { computed } from "vue";
import { useCopilotChatConfiguration } from "../../composables/useCopilotChatConfiguration";

const props = defineProps<{ title?: string }>();
const emit = defineEmits<{ close: [] }>();

const configuration = useCopilotChatConfiguration();

const resolvedTitle = computed(
  () => props.title ?? configuration?.labels?.modalHeaderTitle ?? configuration?.labels?.title ?? "CopilotKit",
);

function handleClose() {
  configuration?.setModalOpen?.(false);
  emit("close");
}
</script>

<template>
  <div data-copilotkit class="cpk-modal-header">
    <slot name="title">
      <span class="cpk-modal-header__title">{{ resolvedTitle }}</span>
    </slot>
    <slot name="close">
      <button class="cpk-modal-header__close cpk-btn-icon" type="button" title="Close" aria-label="Close"
        @click="handleClose">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </slot>
  </div>
</template>
