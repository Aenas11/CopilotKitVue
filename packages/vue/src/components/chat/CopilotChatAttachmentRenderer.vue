<script setup lang="ts">
/** CopilotChatAttachmentRenderer — single attachment thumbnail. Phase C. */
import { computed } from "vue";
import type { Attachment } from "../../composables/useAttachments";

const props = defineProps<{ attachment: Attachment }>();

const previewType = computed(() => {
  const mime = props.attachment.mimeType.toLowerCase();
  if (mime.startsWith("image/")) return "image" as const;
  if (mime.startsWith("audio/")) return "audio" as const;
  if (mime.startsWith("video/")) return "video" as const;
  return "document" as const;
});

const sourceUrl = computed(() => {
  if (props.attachment.url) {
    return props.attachment.url;
  }

  const raw = props.attachment.data ?? "";
  if (!raw) {
    return "";
  }

  if (raw.startsWith("data:")) {
    return raw;
  }

  return `data:${props.attachment.mimeType};base64,${raw}`;
});

const fileLabel = computed(() => {
  const name = props.attachment.name?.trim();
  return name?.length ? name : props.attachment.mimeType;
});
</script>
<template>
  <div class="copilotkit-attachment" :data-type="previewType">
    <slot :attachment="attachment" :preview-type="previewType" :source-url="sourceUrl">
      <img v-if="previewType === 'image'" class="copilotkit-attachment__image" :src="sourceUrl" :alt="attachment.name">

      <audio v-else-if="previewType === 'audio'" class="copilotkit-attachment__audio" :src="sourceUrl" controls
        preload="metadata" />

      <video v-else-if="previewType === 'video'" class="copilotkit-attachment__video" :src="sourceUrl" controls
        preload="metadata" />

      <div v-else class="copilotkit-attachment__document">
        <span class="copilotkit-attachment__document-icon">DOC</span>
        <span class="copilotkit-attachment__document-label">{{ fileLabel }}</span>
      </div>
    </slot>
  </div>
</template>
