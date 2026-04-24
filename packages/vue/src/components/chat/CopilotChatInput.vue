<script setup lang="ts">
/**
 * CopilotChatInput — textarea + send/stop button.
 * Enter to send, Shift+Enter for newline. Mirrors the React CopilotChatInput.
 */
import { ref, computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    isRunning?: boolean;
    autoFocus?: boolean;
    attachmentsEnabled?: boolean;
    attachmentsAccept?: string;
  }>(),
  {
    placeholder: "Ask me anything...",
    disabled: false,
    isRunning: false,
    autoFocus: false,
    attachmentsEnabled: false,
    attachmentsAccept: "*/*",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [value: string];
  addFiles: [files: File[]];
  stop: [];
}>();

const internalValue = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const value = computed({
  get() {
    return props.modelValue !== undefined ? props.modelValue : internalValue.value;
  },
  set(v: string) {
    internalValue.value = v;
    emit("update:modelValue", v);
  },
});

const canSend = computed(() => value.value.trim().length > 0);

function send() {
  const trimmed = value.value.trim();
  if (!trimmed) return;
  emit("submit", trimmed);
  value.value = "";
  textareaRef.value?.focus();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (props.isRunning) emit("stop");
    else send();
  }
}

function handleSendClick() {
  if (props.isRunning) emit("stop");
  else send();
}

function handleAddFileClick() {
  fileInputRef.value?.click();
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  if (files.length > 0) {
    emit("addFiles", files);
  }
  target.value = "";
}

function autoResize(e: Event) {
  const ta = e.target as HTMLTextAreaElement;
  ta.style.height = "auto";
  ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
}
</script>

<template>
  <div class="cpk-input" data-copilotkit>
    <input ref="fileInputRef" type="file" class="cpk-input__file" :accept="attachmentsAccept" multiple
      @change="handleFileInput">

    <button v-if="attachmentsEnabled" class="cpk-input__attach" type="button" aria-label="Add attachment"
      title="Add attachment" @click="handleAddFileClick">
      +
    </button>

    <textarea ref="textareaRef" v-model="value" class="cpk-input__textarea" :placeholder="placeholder"
      :disabled="disabled" :autofocus="autoFocus" rows="1" @keydown="handleKeyDown" @input="autoResize" />
    <button class="cpk-input__send" type="button" :disabled="isRunning ? false : !canSend || disabled"
      :title="isRunning ? 'Stop' : 'Send'" :aria-label="isRunning ? 'Stop generation' : 'Send message'"
      @click="handleSendClick">
      <!-- stop icon when running -->
      <svg v-if="isRunning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="1" />
      </svg>
      <!-- send arrow otherwise -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    </button>
  </div>
</template>
