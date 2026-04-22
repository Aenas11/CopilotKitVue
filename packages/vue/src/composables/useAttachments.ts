import { ref } from "vue";
import type { Message } from "@copilotkit/shared";

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
  data?: string;
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
 * @todo Full implementation pending Phase C.
 */
export function useAttachments(): UseAttachmentsReturn {
  const attachments = ref<Attachment[]>([]);

  async function addAttachment(file: File) {
    const id = crypto.randomUUID();
    const reader = new FileReader();
    reader.onload = () => {
      attachments.value = [
        ...attachments.value,
        {
          id,
          name: file.name,
          mimeType: file.type,
          data: reader.result as string,
        },
      ];
    };
    reader.readAsDataURL(file);
  }

  function removeAttachment(id: string) {
    attachments.value = attachments.value.filter((a) => a.id !== id);
  }

  function clearAttachments() {
    attachments.value = [];
  }

  return { attachments, addAttachment, removeAttachment, clearAttachments };
}
