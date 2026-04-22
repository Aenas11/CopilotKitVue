<script setup lang="ts">
/** WildcardToolCallRender — catch-all renderer for unhandled tool calls. Phase B. */
defineProps<{ toolName: string; args?: unknown; result?: unknown }>();
</script>
<template>
  <div class="copilotkit-tool-call">
    <span class="copilotkit-tool-name">{{ toolName }}</span>
    <slot />
  </div>
</template>
