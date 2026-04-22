<script setup lang="ts">
/**
 * CopilotPopupView — fixed bottom-right floating panel.
 * Mirrors the React CopilotPopupView with click-outside-to-close.
 */
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useCopilotChatConfiguration } from "../../composables/useCopilotChatConfiguration";
import CopilotModalHeader from "./CopilotModalHeader.vue";

const props = withDefaults(
  defineProps<{
    width?: number | string;
    height?: number | string;
    clickOutsideToClose?: boolean;
    showHeader?: boolean;
    title?: string;
  }>(),
  { width: 420, height: 560, clickOutsideToClose: true, showHeader: true },
);

const configuration = useCopilotChatConfiguration();
const isOpen = computed(() => configuration?.isModalOpen ?? false);

const widthCss = computed(() => typeof props.width === "number" ? `${props.width}px` : (props.width ?? "420px"));
const heightCss = computed(() => typeof props.height === "number" ? `${props.height}px` : (props.height ?? "560px"));

const panelRef = ref<HTMLDivElement | null>(null);

function handleClickOutside(e: MouseEvent) {
  if (
    props.clickOutsideToClose &&
    isOpen.value &&
    panelRef.value &&
    !panelRef.value.contains(e.target as Node)
  ) {
    configuration?.setModalOpen?.(false);
  }
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>

<template>
  <div ref="panelRef" data-copilotkit class="cpk-popup" :class="{ 'is-open': isOpen }"
    :style="{ '--cpk-popup-width': widthCss, '--cpk-popup-height': heightCss }" role="dialog" :aria-hidden="!isOpen">
    <div class="cpk-popup__inner">
      <CopilotModalHeader v-if="showHeader" :title="title" />
      <slot />
    </div>
  </div>
</template>
