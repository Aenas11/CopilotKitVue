<script setup lang="ts">
/**
 * CopilotChatToggleButton — floating action button to open/close sidebar or popup.
 * Mirrors the React CopilotChatToggleButton.
 */
import { computed } from "vue";
import { useCopilotChatConfiguration } from "../../composables/useCopilotChatConfiguration";

const configuration = useCopilotChatConfiguration();
const isOpen = computed(() => configuration?.isModalOpen ?? false);

function toggle() {
  configuration?.setModalOpen?.(!isOpen.value);
}
</script>

<template>
  <button data-copilotkit class="cpk-toggle-btn" type="button" :aria-label="isOpen ? 'Close chat' : 'Open chat'"
    :aria-pressed="isOpen" @click="toggle">
    <slot>
      <!-- close icon when open -->
      <svg v-if="isOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      <!-- message circle when closed -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
        stroke="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </slot>
  </button>
</template>
