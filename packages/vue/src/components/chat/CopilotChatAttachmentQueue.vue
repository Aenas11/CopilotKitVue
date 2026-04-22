<script setup lang="ts">
/** CopilotChatAttachmentQueue — pending attachment thumbnails. Phase C. */
import type { Attachment } from "../../composables/useAttachments";
defineProps<{ attachments: Attachment[] }>();
const emit = defineEmits<{ remove: [id: string] }>();
</script>
<template>
  <div class="copilotkit-attachment-queue">
    <slot />
  </div>
</template>
