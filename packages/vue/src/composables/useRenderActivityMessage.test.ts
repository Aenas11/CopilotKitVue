import { describe, expect, it, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import type { ActivityMessage } from "@ag-ui/core";
import { useRenderActivityMessage } from "./useRenderActivityMessage";

const mockUseCopilotKit = vi.fn();
const mockUseCopilotChatConfiguration = vi.fn();

vi.mock("./useCopilotKit", () => ({
    useCopilotKit: () => mockUseCopilotKit(),
}));

vi.mock("./useCopilotChatConfiguration", () => ({
    useCopilotChatConfiguration: () => mockUseCopilotChatConfiguration(),
}));

function mountHook() {
    let result: ReturnType<typeof useRenderActivityMessage> | undefined;

    const Probe = defineComponent({
        setup() {
            result = useRenderActivityMessage();
            return () => null;
        },
    });

    mount(Probe);
    return result!;
}

describe("useRenderActivityMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("selects renderer with agent-specific precedence and renders parsed content", () => {
        const renderSpecific = vi.fn(() => "specific");
        const renderGlobal = vi.fn(() => "global");

        mockUseCopilotChatConfiguration.mockReturnValue({ agentId: "agent-a" });
        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                renderActivityMessages: [
                    {
                        activityType: "workflow",
                        content: { safeParse: (value: unknown) => ({ success: true as const, data: value }) },
                        render: renderGlobal,
                    },
                    {
                        activityType: "workflow",
                        agentId: "agent-a",
                        content: { safeParse: (value: unknown) => ({ success: true as const, data: value }) },
                        render: renderSpecific,
                    },
                ],
                getAgent: (id: string) => ({ id }),
            },
        });

        const hook = mountHook();
        const message = {
            id: "m-1",
            role: "activity",
            activityType: "workflow",
            content: { foo: 1 },
        } as unknown as ActivityMessage;

        const output = hook.renderActivityMessage(message);

        expect(output).toBe("specific");
        expect(renderSpecific).toHaveBeenCalledWith(
            expect.objectContaining({
                activityType: "workflow",
                content: { foo: 1 },
            }),
        );
        expect(renderGlobal).not.toHaveBeenCalled();
    });

    it("falls back to wildcard renderer when exact match is absent", () => {
        const renderWildcard = vi.fn(() => "wild");

        mockUseCopilotChatConfiguration.mockReturnValue({ agentId: "agent-a" });
        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                renderActivityMessages: [
                    {
                        activityType: "*",
                        content: { safeParse: (value: unknown) => ({ success: true as const, data: value }) },
                        render: renderWildcard,
                    },
                ],
                getAgent: () => undefined,
            },
        });

        const hook = mountHook();
        const message = {
            id: "m-2",
            role: "activity",
            activityType: "unknown",
            content: { bar: 2 },
        } as unknown as ActivityMessage;

        expect(hook.renderActivityMessage(message)).toBe("wild");
        expect(renderWildcard).toHaveBeenCalledOnce();
    });

    it("returns null and warns when schema parse fails", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

        mockUseCopilotChatConfiguration.mockReturnValue({ agentId: "agent-a" });
        mockUseCopilotKit.mockReturnValue({
            copilotkit: {
                renderActivityMessages: [
                    {
                        activityType: "workflow",
                        content: { safeParse: () => ({ success: false as const, error: "bad" }) },
                        render: vi.fn(() => "never"),
                    },
                ],
                getAgent: () => undefined,
            },
        });

        const hook = mountHook();
        const message = {
            id: "m-3",
            role: "activity",
            activityType: "workflow",
            content: { bad: true },
        } as unknown as ActivityMessage;

        expect(hook.renderActivityMessage(message)).toBeNull();
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });
});
