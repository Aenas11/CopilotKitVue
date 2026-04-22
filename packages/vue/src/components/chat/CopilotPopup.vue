<script setup lang="ts">
/**
 * CopilotPopup — floating popup that wraps CopilotChat.
 * Mirrors the React CopilotPopupView (convenience wrapper).
 */
import CopilotChatConfigurationProvider from "../../providers/CopilotChatConfigurationProvider.vue";
import CopilotPopupView from "../layout/CopilotPopupView.vue";
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
    height?: number | string;
    clickOutsideToClose?: boolean;
  }>(),
  { defaultOpen: false, clickOutsideToClose: true },
);
</script>

<template>
  <!-- The ConfigurationProvider owns isModalOpen for this subtree -->
  <CopilotChatConfigurationProvider :thread-id="threadId" :agent-id="agentId" :labels="labels"
    :is-modal-default-open="defaultOpen">
    <!-- Toggle button floats at bottom-right -->
    <CopilotChatToggleButton />

    <CopilotPopupView :width="width" :height="height" :click-outside-to-close="clickOutsideToClose" :show-header="true">
      <CopilotChat :agent-id="agentId" :thread-id="threadId" :labels="labels" :is-modal-default-open="defaultOpen" />
    </CopilotPopupView>
  </CopilotChatConfigurationProvider>
</template>
