<script setup lang="ts">
/** CopilotChatAttachmentRenderer — single attachment thumbnail. Phase C. */
import { computed, ref, watch } from "vue";
import type { Attachment } from "../../composables/useAttachments";

const props = defineProps<{ attachment: Attachment }>();
const imageLoadFailed = ref(false);

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
  return name?.length ? name : (props.attachment.mimeType || "Unknown type");
});

const documentIcon = computed(() => {
  const mime = props.attachment.mimeType.toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("sheet") || mime.includes("excel")) return "XLS";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPT";
  if (mime.includes("word") || mime.includes("document")) return "DOC";
  if (mime.includes("text/")) return "TXT";
  return "FILE";
});

watch(
  () => sourceUrl.value,
  () => {
    imageLoadFailed.value = false;
  },
);

function handleImageError() {
  imageLoadFailed.value = true;
}
</script>
<template>
  <div class="copilotkit-attachment" :data-type="previewType">
    <slot :attachment="attachment" :preview-type="previewType" :source-url="sourceUrl">
      <img v-if="previewType === 'image' && !imageLoadFailed" class="copilotkit-attachment__image" :src="sourceUrl"
        :alt="attachment.name || 'Image attachment'" @error="handleImageError">

      <div v-else-if="previewType === 'image'" class="copilotkit-attachment__image-error">
        <span>Failed to load image</span>
      </div>

      <audio v-else-if="previewType === 'audio'" class="copilotkit-attachment__audio" :src="sourceUrl" controls
        preload="metadata" />

      <video v-else-if="previewType === 'video'" class="copilotkit-attachment__video" :src="sourceUrl" controls
        preload="metadata" />

      <div v-else class="copilotkit-attachment__document">
        <span class="copilotkit-attachment__document-icon">{{ documentIcon }}</span>
        <span class="copilotkit-attachment__document-label">{{ fileLabel }}</span>
      </div>
    </slot>
  </div>
</template>
