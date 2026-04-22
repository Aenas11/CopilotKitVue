<script setup lang="ts">
/** CopilotChatAttachmentRenderer — single attachment thumbnail. Phase C. */
import type { Attachment } from "../../composables/useAttachments";
defineProps<{ attachment: Attachment }>();
</script>
<template>
  <div class="copilotkit-attachment">
    <slot />
  </div>
</template>
