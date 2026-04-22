<script setup lang="ts">
/**
 * CopilotSidebarView — slide-in right panel with resize handle.
 * Wraps CopilotChatConfigurationProvider internally so it owns modal open state.
 * Mirrors the React CopilotSidebarView.
 */
import { ref, computed } from "vue";
import { useCopilotChatConfiguration } from "../../composables/useCopilotChatConfiguration";
import CopilotModalHeader from "./CopilotModalHeader.vue";

const props = withDefaults(
  defineProps<{
    width?: number | string;
    showHeader?: boolean;
    title?: string;
  }>(),
  { width: 480, showHeader: true },
);

const configuration = useCopilotChatConfiguration();
const isOpen = computed(() => configuration?.isModalOpen ?? false);

const sidebarWidth = ref<number | string>(props.width);

const widthCss = computed(() => {
  const w = sidebarWidth.value;
  if (typeof w === "number") return `${w}px`;
  return w;
});

// Resize handle logic
const isResizing = ref(false);
let resizeStart = 0;
let resizeStartWidth = 0;

function startResize(e: MouseEvent) {
  isResizing.value = true;
  resizeStart = e.clientX;
  resizeStartWidth = typeof sidebarWidth.value === "number" ? sidebarWidth.value : 480;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize, { once: true });
}

function onResize(e: MouseEvent) {
  if (!isResizing.value) return;
  const delta = resizeStart - e.clientX;
  sidebarWidth.value = Math.max(280, resizeStartWidth + delta);
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener("mousemove", onResize);
}
</script>

<template>
  <aside data-copilotkit class="cpk-sidebar" :class="{ 'is-open': isOpen }"
    :style="{ '--cpk-sidebar-width': widthCss }">
    <div class="cpk-sidebar__resize-handle" @mousedown="startResize" />
    <div class="cpk-sidebar__inner">
      <CopilotModalHeader v-if="showHeader" :title="title" />
      <slot />
    </div>
  </aside>
</template>
