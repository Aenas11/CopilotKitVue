<script setup lang="ts">
/**
 * CopilotChat — top-level chat orchestrator.
 * Runs useAgent + useSuggestions, passes state to CopilotChatView.
 * Mirrors the React CopilotChat.
 */
import { computed, inject, ref } from "vue";
import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
import type { AttachmentsConfig } from "@copilotkit/shared";
import type { Suggestion } from "@copilotkit/core";
import CopilotChatConfigurationProvider from "../../providers/CopilotChatConfigurationProvider.vue";
import CopilotChatView from "./CopilotChatView.vue";
import type { CopilotChatConfiguration } from "../../providers/keys";
import { CopilotKitKey } from "../../providers/keys";
import { useCopilotChat } from "../../composables/useCopilotChat";
import { useSuggestions } from "../../composables/useSuggestions";
import { useAttachments, type Attachment } from "../../composables/useAttachments";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    agentId?: string;
    threadId?: string;
    labels?: CopilotChatConfiguration["labels"];
    className?: string;
    throttleMs?: number;
    isModalDefaultOpen?: boolean;
    hideTextWhenCustomToolRendered?: boolean;
    attachments?: AttachmentsConfig;
  }>(),
  {
    hideTextWhenCustomToolRendered: true,
  },
);

const context = inject(CopilotKitKey);

const { messages, sendMessage, stop, isLoading } = useCopilotChat({
  agentId: computed(() => props.agentId ?? DEFAULT_AGENT_ID) as any,
  throttleMs: computed(() => props.throttleMs) as any,
});

const { suggestions } = useSuggestions();
const { attachments, addAttachment, removeAttachment, clearAttachments } = useAttachments({
  config: computed(() => props.attachments),
});

const attachmentsEnabled = computed(() => props.attachments?.enabled ?? false);
const attachmentsAccept = computed(() => props.attachments?.accept ?? "*/*");

// ---------------------------------------------------------------------------
// Transcription state machine — mirrors React CopilotChat transcribeMode
// ---------------------------------------------------------------------------

/** Whether the runtime supports audio transcription (runtimeUrl configured). */
const showTranscription = computed(
  () => typeof MediaRecorder !== "undefined" && !!(context?.copilotkit.runtimeUrl),
);

type InputMode = "input" | "transcribe" | "processing";
const inputMode = ref<InputMode>("input");

function handleStartTranscribe() {
  inputMode.value = "transcribe";
}

function handleCancelTranscribe() {
  inputMode.value = "input";
}

async function handleFinishTranscribeWithAudio(blob: Blob) {
  const runtimeUrl = context?.copilotkit.runtimeUrl;
  if (!runtimeUrl) {
    inputMode.value = "input";
    return;
  }

  inputMode.value = "processing";
  try {
    const headers: Record<string, string> = { ...(context?.copilotkit.headers ?? {}) };
    delete headers["Content-Type"];

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    const response = await fetch(`${runtimeUrl}/transcribe`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.ok) {
      const data = (await response.json()) as { text?: string };
      const text = data.text ?? "";
      if (text.trim()) {
        await handleSubmitMessage(text);
      }
    } else {
      console.error("[CopilotChat] Transcription failed:", response.status, response.statusText);
    }
  } catch (err) {
    console.error("[CopilotChat] Transcription error:", err);
  } finally {
    inputMode.value = "input";
  }
}

// ---------------------------------------------------------------------------
// Message & attachment handling
// ---------------------------------------------------------------------------

function handleSelectSuggestion(suggestion: Suggestion) {
  sendMessage(suggestion.message || suggestion.title);
}

async function handleAddFiles(files: File[]) {
  if (!attachmentsEnabled.value || files.length === 0) {
    return;
  }

  for (const file of files) {
    await addAttachment(file);
  }
}

function getAttachmentType(attachment: Attachment): "image" | "audio" | "video" | "document" {
  const mime = attachment.mimeType.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

async function handleSubmitMessage(text: string) {
  const readyAttachments = attachmentsEnabled.value
    ? [...(attachments.value ?? [])].filter((item) => (item.status ?? "ready") === "ready")
    : [];

  if (!readyAttachments.length) {
    await sendMessage(text);
    return;
  }

  const contentParts: Array<Record<string, unknown>> = [];
  if (text.trim().length > 0) {
    contentParts.push({ type: "text", text: text.trim() });
  }

  for (const attachment of readyAttachments) {
    if (!attachment.data && !attachment.url) {
      continue;
    }

    contentParts.push({
      type: getAttachmentType(attachment),
      source: attachment.url
        ? { type: "url", value: attachment.url, mimeType: attachment.mimeType }
        : {
          type: "data",
          value: normalizeDataSourceValue(attachment.data ?? ""),
          mimeType: attachment.mimeType,
        },
      metadata: {
        filename: attachment.name,
        ...(attachment.metadata ?? {}),
      },
    });
  }

  if (!contentParts.length) {
    await sendMessage(text);
    return;
  }

  await sendMessage(contentParts as never);
  clearAttachments();
}

function normalizeDataSourceValue(value: string): string {
  if (!value.startsWith("data:")) {
    return value;
  }

  const commaIndex = value.indexOf(",");
  return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
}
</script>

<template>
  <CopilotChatConfigurationProvider :thread-id="threadId" :agent-id="agentId" :labels="labels"
    :is-modal-default-open="isModalDefaultOpen">
    <div class="cpk-chat" data-copilotkit :class="className" v-bind="$attrs">
      <CopilotChatView :messages="messages ?? []" :is-running="isLoading" :suggestions="suggestions ?? []"
        :attachments="attachments ?? []" :attachments-enabled="attachmentsEnabled"
        :attachments-accept="attachmentsAccept" :input-placeholder="labels?.placeholder"
        :hide-text-when-custom-tool-rendered="hideTextWhenCustomToolRendered" :input-mode="inputMode"
        :show-transcription="showTranscription" @submit-message="handleSubmitMessage" @stop="stop"
        @select-suggestion="handleSelectSuggestion" @add-files="handleAddFiles" @remove-attachment="removeAttachment"
        @start-transcribe="handleStartTranscribe" @cancel-transcribe="handleCancelTranscribe"
        @finish-transcribe-with-audio="handleFinishTranscribeWithAudio" />
    </div>
  </CopilotChatConfigurationProvider>
</template>
