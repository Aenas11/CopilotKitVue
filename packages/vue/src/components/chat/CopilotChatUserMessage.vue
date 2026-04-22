<script setup lang="ts">
/**
 * CopilotChatUserMessage — renders a user message with text and attachments.
 * Mirrors the React CopilotChatUserMessage.
 */
import { computed, ref } from "vue";
import type { UserMessage } from "@ag-ui/core";

const props = defineProps<{ message: UserMessage }>();
const copied = ref(false);

const textContent = computed(() => {
  const content = props.message.content;
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((p): p is { type: "text"; text: string } => p && (p as any).type === "text")
    .map((p) => p.text)
    .join("\n");
});

async function copyContent() {
  try {
    await navigator.clipboard.writeText(textContent.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch { /* clipboard not available */ }
}
</script>

<template>
  <div data-copilotkit class="cpk-message cpk-message--user">
    <div class="cpk-message__content">{{ textContent }}</div>
    <div class="cpk-message__toolbar cpk-message__toolbar--user">
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
    </div>
  </div>
</template>
