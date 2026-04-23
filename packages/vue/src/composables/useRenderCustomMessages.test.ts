import { describe, expect, it, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import type { Message } from "@ag-ui/core";
import { useRenderCustomMessages } from "./useRenderCustomMessages";

const mockUseCopilotKit = vi.fn();
const mockUseCopilotChatConfiguration = vi.fn();

vi.mock("./useCopilotKit", () => ({
    useCopilotKit: () => mockUseCopilotKit(),
}));

vi.mock("./useCopilotChatConfiguration", () => ({
    useCopilotChatConfiguration: () => mockUseCopilotChatConfiguration(),
}));

function mountHook() {
    let result: ReturnType<typeof useRenderCustomMessages> | undefined;

    const Probe = defineComponent({
        setup() {
            result = useRenderCustomMessages();
            return () => null;
        },
    });

    mount(Probe);
    return result!;
}

describe("useRenderCustomMessages", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("prefers agent-specific renderer and passes run/message metadata", () => {
        const renderGlobal = vi.fn(() => "global");
        const renderScoped = vi.fn(() => "scoped");

        const message = { id: "m-2", role: "assistant", content: "hello" } as Message;
        const messages = [
            { id: "m-1", role: "user", content: "u" } as Message,
            message,
            { id: "m-3", role: "assistant", content: "a" } as Message,
        ];

        mockUseCopilotChatConfiguration.mockReturnValue({ agentId: "agent-a", threadId: "thread-1" });
        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                renderCustomMessages: [
                    { render: renderGlobal },
                    { agentId: "agent-a", render: renderScoped },
                ],
                getRunIdForMessage: (_agentId: string, _threadId: string, messageId: string) =>
                    messageId === "m-2" || messageId === "m-3" ? "run-1" : undefined,
                getRunIdsForThread: () => ["run-1"],
                getStateByRun: () => ({ phase: "ok" }),
                getAgent: () => ({ messages }),
            },
        });

        const hook = mountHook();
        const render = hook!;
        const output = render({ message, position: "after" });

        expect(output).toBe("scoped");
        expect(renderScoped).toHaveBeenCalledWith(
            expect.objectContaining({
                runId: "run-1",
                messageIndex: 1,
                messageIndexInRun: 0,
                numberOfMessagesInRun: 2,
                agentId: "agent-a",
                stateSnapshot: { phase: "ok" },
            }),
        );
        expect(renderGlobal).not.toHaveBeenCalled();
    });

    it("falls back to missing-run-id token when no run can be resolved", () => {
        const renderer = vi.fn(() => "ok");
        const message = { id: "m-x", role: "assistant", content: "x" } as Message;

        mockUseCopilotChatConfiguration.mockReturnValue({ agentId: "agent-a", threadId: "thread-1" });
        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                renderCustomMessages: [{ render: renderer }],
                getRunIdForMessage: () => undefined,
                getRunIdsForThread: () => [],
                getStateByRun: () => undefined,
                getAgent: () => ({ messages: [message] }),
            },
        });

        const hook = mountHook();
        const output = hook!({ message, position: "before" });

        expect(output).toBe("ok");
        expect(renderer).toHaveBeenCalledWith(
            expect.objectContaining({ runId: "missing-run-id:m-x" }),
        );
    });

    it("returns null when there is no matching renderer or agent", () => {
        const message = { id: "m-0", role: "assistant", content: "none" } as Message;

        mockUseCopilotChatConfiguration.mockReturnValue({ agentId: "agent-a", threadId: "thread-1" });
        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                renderCustomMessages: [],
                getAgent: () => undefined,
            },
        });

        const hook = mountHook();
        expect(hook!({ message, position: "after" })).toBeNull();
    });
});
