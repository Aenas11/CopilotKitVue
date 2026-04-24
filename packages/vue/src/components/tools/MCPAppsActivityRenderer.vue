<script setup lang="ts">
/** MCPAppsActivityRenderer — renders MCP app activity messages. Phase C. */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    activity?: unknown;
  }>(),
  {
    title: "MCP Activity",
    activity: undefined,
  },
);

const activityJson = computed(() => {
  if (!props.activity) {
    return "No activity payload.";
  }

  try {
    return JSON.stringify(props.activity, null, 2);
  } catch {
    return "Unable to serialize activity payload.";
  }
});
</script>
<template>
  <div class="copilotkit-mcp-activity">
    <slot :activity="activity" :title="title">
      <div class="copilotkit-mcp-activity__header">{{ title }}</div>
      <pre class="copilotkit-mcp-activity__payload">{{ activityJson }}</pre>
    </slot>
  </div>
</template>
