import { beforeEach, describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";
import type { Message } from "@ag-ui/client";

const mockUseCopilotKit = vi.fn();
const mockUseAgent = vi.fn();

vi.mock("./useCopilotKit", () => ({
    useCopilotKit: () => mockUseCopilotKit(),
}));

vi.mock("./useAgent", () => ({
    useAgent: (...args: unknown[]) => mockUseAgent(...args),
}));

import { useCopilotChat } from "./useCopilotChat";

type MockAgent = {
    messages: Message[];
    subscribe: ReturnType<typeof vi.fn>;
};

describe("useCopilotChat", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("sendMessage appends a user message and invokes runAgent", async () => {
        const agent: MockAgent = {
            messages: [],
            subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };

        const runAgent = vi.fn(async () => {
            agent.messages = [
                ...agent.messages,
                { id: "a1", role: "assistant", content: "response" } as Message,
            ];
        });

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                runAgent,
                stopAgent: vi.fn(),
                properties: { app: "tests" },
            },
        });

        mockUseAgent.mockReturnValue({
            agent: shallowRef(agent),
            messages: shallowRef<Message[]>([]),
            isRunning: shallowRef(false),
        });

        const chat = useCopilotChat();
        await chat.sendMessage("hello");

        expect(runAgent).toHaveBeenCalledTimes(1);
        expect(agent.messages[0]?.role).toBe("user");
        expect(chat.messages.value?.at(-1)?.role).toBe("assistant");
        expect(chat.error.value).toBeNull();
    });

    it("stop delegates to copilotkit.stopAgent", () => {
        const agent: MockAgent = {
            messages: [],
            subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };

        const stopAgent = vi.fn();

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                runAgent: vi.fn(),
                stopAgent,
                properties: {},
            },
        });

        mockUseAgent.mockReturnValue({
            agent: shallowRef(agent),
            messages: shallowRef<Message[]>([]),
            isRunning: shallowRef(false),
        });

        const chat = useCopilotChat();
        chat.stop();

        expect(stopAgent).toHaveBeenCalledWith({ agent });
    });

    it("reload triggers runAgent for current agent", async () => {
        const agent: MockAgent = {
            messages: [{ id: "u1", role: "user", content: "existing" } as Message],
            subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        };

        const runAgent = vi.fn(async () => {
            agent.messages = [
                ...agent.messages,
                { id: "a2", role: "assistant", content: "reloaded" } as Message,
            ];
        });

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                runAgent,
                stopAgent: vi.fn(),
                properties: {},
            },
        });

        mockUseAgent.mockReturnValue({
            agent: shallowRef(agent),
            messages: shallowRef<Message[]>([]),
            isRunning: shallowRef(false),
        });

        const chat = useCopilotChat();
        await chat.reload();

        expect(runAgent).toHaveBeenCalledTimes(1);
        expect(chat.messages.value?.at(-1)?.content).toBe("reloaded");
    });

    it("captures run failures in error ref", async () => {
        const agent: MockAgent = {
            messages: [],
            subscribe: vi.fn((handlers: { onRunFailed?: (event: { error: Error }) => void }) => {
                handlers.onRunFailed?.({ error: new Error("run failed") });
                return { unsubscribe: vi.fn() };
            }),
        };

        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                runAgent: vi.fn(async () => { }),
                stopAgent: vi.fn(),
                properties: {},
            },
        });

        mockUseAgent.mockReturnValue({
            agent: shallowRef(agent),
            messages: shallowRef<Message[]>([]),
            isRunning: shallowRef(false),
        });

        const chat = useCopilotChat();
        await chat.sendMessage("hello");

        expect(chat.error.value?.message).toBe("run failed");
        expect(chat.isLoading.value).toBe(false);
    });
});
