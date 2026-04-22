<script setup lang="ts">
/**
 * CopilotSidebar — slide-in sidebar that wraps CopilotChat.
 * Mirrors the React CopilotSidebarView (convenience wrapper).
 */
import CopilotChatConfigurationProvider from "../../providers/CopilotChatConfigurationProvider.vue";
import CopilotSidebarView from "../layout/CopilotSidebarView.vue";
import CopilotChatToggleButton from "./CopilotChatToggleButton.vue";
import CopilotChat from "./CopilotChat.vue";
import type { CopilotChatConfiguration } from "../../providers/keys";

const props = withDefaults(
  defineProps<{
    agentId?: string;
    threadId?: string;
    labels?: CopilotChatConfiguration["labels"];
    defaultOpen?: boolean;
    width?: number | string;
  }>(),
  { defaultOpen: true },
);
</script>

<template>
  <!-- The ConfigurationProvider owns isModalOpen for this subtree -->
  <CopilotChatConfigurationProvider :thread-id="threadId" :agent-id="agentId" :labels="labels"
    :is-modal-default-open="defaultOpen">
    <!-- Toggle button floats outside the sidebar panel -->
    <CopilotChatToggleButton />

    <CopilotSidebarView :width="width" :show-header="true">
      <!-- CopilotChat runs agent internally; pass config down -->
      <CopilotChat :agent-id="agentId" :thread-id="threadId" :labels="labels" :is-modal-default-open="defaultOpen" />
    </CopilotSidebarView>
  </CopilotChatConfigurationProvider>
</template>
