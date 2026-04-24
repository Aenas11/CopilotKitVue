import { describe, expect, it, vi } from "vitest";
import { useAttachments } from "./useAttachments";

describe("useAttachments", () => {
    it("adds an attachment with generated id and data URL", async () => {
        const originalRandomUUID = globalThis.crypto.randomUUID;

        vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");

        const { attachments, addAttachment } = useAttachments({
            config: {
                enabled: true,
                onUpload: async () => ({
                    type: "data",
                    value: "ZmFrZQ==",
                    mimeType: "text/plain",
                    metadata: {
                        source: "unit-test",
                    },
                }),
            },
        });
        const file = new File(["hello"], "greeting.txt", { type: "text/plain" });

        await addAttachment(file);

        const items = attachments.value ?? [];
        expect(items).toHaveLength(1);
        expect(items[0]).toEqual({
            id: "00000000-0000-4000-8000-000000000001",
            name: "greeting.txt",
            mimeType: "text/plain",
            size: 5,
            status: "ready",
            metadata: {
                source: "unit-test",
            },
            data: "ZmFrZQ==",
        });

        vi.spyOn(globalThis.crypto, "randomUUID").mockRestore();
        globalThis.crypto.randomUUID = originalRandomUUID;
    });

    it("removes and clears attachments", () => {
        const { attachments, removeAttachment, clearAttachments } = useAttachments();

        attachments.value = [
            { id: "a", name: "a.txt", mimeType: "text/plain", data: "data:text/plain;base64,QQ==" },
            { id: "b", name: "b.txt", mimeType: "text/plain", data: "data:text/plain;base64,Qg==" },
        ];

        removeAttachment("a");
        expect((attachments.value ?? []).map((item) => item.id)).toEqual(["b"]);

        clearAttachments();
        expect(attachments.value ?? []).toEqual([]);
    });
});
