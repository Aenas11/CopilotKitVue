import { ref, toValue, type MaybeRefOrGetter } from "vue";
import {
  exceedsMaxSize,
  formatFileSize,
  matchesAcceptFilter,
  readFileAsBase64,
} from "@copilotkit/shared";
import type {
  AttachmentUploadResult,
  AttachmentsConfig,
} from "@copilotkit/shared";

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  status?: "uploading" | "ready";
  metadata?: Record<string, unknown>;
  url?: string;
  /** Base64 payload (without `data:` prefix) when source type is data. */
  data?: string;
}

export interface UseAttachmentsOptions {
  config?: MaybeRefOrGetter<AttachmentsConfig | undefined>;
}

export interface UseAttachmentsReturn {
  attachments: ReturnType<typeof ref<Attachment[]>>;
  addAttachment(file: File): Promise<void>;
  removeAttachment(id: string): void;
  clearAttachments(): void;
}

/**
 * Manages file attachments for a chat session.
 * Mirrors the React `useAttachments` hook.
 *
 */
export function useAttachments(options: UseAttachmentsOptions = {}): UseAttachmentsReturn {
  const attachments = ref<Attachment[]>([]);

  async function addAttachment(file: File) {
    const config = toValue(options.config);
    const accept = config?.accept ?? "*/*";
    const maxSize = config?.maxSize ?? 20 * 1024 * 1024;

    if (!matchesAcceptFilter(file, accept)) {
      config?.onUploadFailed?.({
        reason: "invalid-type",
        file,
        message: `File \"${file.name}\" is not accepted. Supported types: ${accept}`,
      });
      return;
    }

    if (exceedsMaxSize(file, maxSize)) {
      config?.onUploadFailed?.({
        reason: "file-too-large",
        file,
        message: `File \"${file.name}\" exceeds the maximum size of ${formatFileSize(maxSize)}`,
      });
      return;
    }

    const id = crypto.randomUUID?.() ?? `attachment-${Date.now()}-${attachments.value.length}`;

    attachments.value = [
      ...attachments.value,
      {
        id,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        status: "uploading",
      },
    ];

    try {
      const uploaded = config?.onUpload ? await config.onUpload(file) : undefined;
      const normalized = await normalizeUploadResult(file, uploaded);

      attachments.value = attachments.value.map((attachment) => {
        if (attachment.id !== id) {
          return attachment;
        }

        return {
          ...attachment,
          ...normalized,
          status: "ready",
        };
      });
    } catch (error) {
      attachments.value = attachments.value.filter((attachment) => attachment.id !== id);

      config?.onUploadFailed?.({
        reason: "upload-failed",
        file,
        message:
          error instanceof Error
            ? error.message
            : `Failed to upload \"${file.name}\"`,
      });
    }
  }

  function removeAttachment(id: string) {
    attachments.value = attachments.value.filter((a) => a.id !== id);
  }

  function clearAttachments() {
    attachments.value = [];
  }

  return { attachments, addAttachment, removeAttachment, clearAttachments };
}

async function normalizeUploadResult(
  file: File,
  uploaded?: AttachmentUploadResult,
): Promise<Pick<Attachment, "mimeType" | "data" | "url" | "metadata">> {
  if (!uploaded) {
    return {
      mimeType: file.type || "application/octet-stream",
      data: await readFileAsBase64(file),
    };
  }

  if (uploaded.type === "url") {
    return {
      mimeType: uploaded.mimeType || file.type || "application/octet-stream",
      url: uploaded.value,
      metadata: uploaded.metadata,
    };
  }

  return {
    mimeType: uploaded.mimeType || file.type || "application/octet-stream",
    data: uploaded.value,
    metadata: uploaded.metadata,
  };
}
