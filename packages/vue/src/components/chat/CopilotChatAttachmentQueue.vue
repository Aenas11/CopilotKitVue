<script setup lang="ts">
/** CopilotChatAttachmentQueue — pending attachment thumbnails. Phase C. */
import type { Attachment } from "../../composables/useAttachments";
import CopilotChatAttachmentRenderer from "./CopilotChatAttachmentRenderer.vue";

defineProps<{ attachments: Attachment[] }>();
const emit = defineEmits<{ remove: [id: string] }>();
</script>
<template>
  <div v-if="attachments.length > 0" class="copilotkit-attachment-queue" data-testid="copilot-attachment-queue">
    <div v-for="attachment in attachments" :key="attachment.id" class="copilotkit-attachment-queue__item">
      <slot name="item" :attachment="attachment" :remove="() => emit('remove', attachment.id)">
        <CopilotChatAttachmentRenderer :attachment="attachment" />
        <button class="copilotkit-attachment-queue__remove" type="button" aria-label="Remove attachment"
          @click="emit('remove', attachment.id)">
          x
        </button>
      </slot>
    </div>
  </div>
</template>
