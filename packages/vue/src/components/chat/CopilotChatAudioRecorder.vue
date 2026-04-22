<script setup lang="ts">
/** CopilotChatAudioRecorder — voice input button. Phase C. */
const emit = defineEmits<{ transcript: [text: string] }>();
</script>
<template>
  <button class="copilotkit-audio-recorder">
    <slot />
  </button>
</template>
