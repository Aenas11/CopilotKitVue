import type { Message } from "@ag-ui/client";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import { defineComponent, h, provide } from "vue";
import CopilotChatView from "../components/chat/CopilotChatView.vue";
import { useRenderTool } from "../composables/useRenderTool";
import { CopilotKitKey } from "../providers/keys";

const mockCore = {} as any;

const StoryCopilotProvider = defineComponent({
    name: "StoryCopilotProvider",
    setup(_, { slots }) {
        provide(CopilotKitKey, { copilotkit: mockCore });
        return () => slots.default?.();
    },
});

const RegisterReleaseRenderer = defineComponent({
    name: "RegisterReleaseRenderer",
    setup() {
        useRenderTool({
            name: "generate_release_note",
            render: ({ args, status, result }) =>
                h("div", { class: "cpk-render-tool", "data-testid": "custom-render-tool" }, [
                    h("strong", "Release Note Tool"),
                    h("div", `status: ${status}`),
                    h("div", `repo: ${String((args as { repository?: string }).repository ?? "unknown")}`),
                    h("div", `result: ${JSON.stringify(result)}`),
                ]),
        });

        return () => null;
    },
});

const RegisterWildcardRenderer = defineComponent({
    name: "RegisterWildcardRenderer",
    setup() {
        useRenderTool({
            name: "*",
            render: ({ name, status }) =>
                h("div", { class: "cpk-render-tool", "data-testid": "wildcard-render-tool" }, [
                    h("strong", "Wildcard Tool Renderer"),
                    h("div", `tool: ${name}`),
                    h("div", `status: ${status}`),
                ]),
        });

        return () => null;
    },
});

const WhyRenderToolMatters = defineComponent({
    name: "WhyRenderToolMatters",
    setup() {
        return () =>
            h(
                "div",
                {
                    "data-testid": "why-render-tool",
                    style: {
                        width: "440px",
                        boxSizing: "border-box",
                        marginBottom: "10px",
                        padding: "10px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        color: "#334155",
                        fontSize: "12px",
                        lineHeight: "1.45",
                    },
                },
                [
                    h("strong", "Why this feature is needed"),
                    h(
                        "div",
                        "Tool calls are often raw and technical. useRenderTool lets you convert them into clear UI so users can understand what the agent is doing and why.",
                    ),
                ],
            );
    },
});

const toolCallMessages: Message[] = [
    { id: "u-1", role: "user", content: "Create a release note from commits" } as Message,
    {
        id: "a-1",
        role: "assistant",
        content: "Running release note generator...",
        toolCalls: [
            {
                id: "tc-1",
                function: {
                    name: "generate_release_note",
                    arguments: '{"repository":"copilotkit-vue","changes":12}',
                },
            },
        ],
    } as Message,
    {
        id: "t-1",
        role: "tool",
        toolCallId: "tc-1",
        content: '{"summary":"Added render tool support and style sync checks."}',
    } as Message,
];

const runningToolCallMessages: Message[] = [
    { id: "u-2", role: "user", content: "Generate release note draft" } as Message,
    {
        id: "a-2",
        role: "assistant",
        content: "",
        toolCalls: [
            {
                id: "tc-2",
                function: {
                    name: "generate_release_note",
                    arguments: '{"repository":"copilotkit-vue","changes":3}',
                },
            },
        ],
    } as Message,
];

const meta = {
    title: "Scenarios/Deterministic/Render Tool",
    component: CopilotChatView,
    tags: ["test", "complex", "autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Demonstrates useRenderTool and useDefaultRenderTool behavior for tool calls inside chat messages. " +
                    "This feature is needed because raw tool calls are often technical (arguments, statuses, JSON results) and not user-friendly by default. " +
                    "Custom renderers let product teams present tool activity as clear, domain-specific UI (cards, status chips, previews), improving trust, readability, and debugging during agent workflows.",
            },
        },
    },
} satisfies Meta<typeof CopilotChatView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CustomRendererComplete: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Named renderer example: only generate_release_note tool calls are customized. " +
                    "Use this pattern when each tool needs dedicated presentation logic.",
            },
        },
    },
    render: () => ({
        components: {
            StoryCopilotProvider,
            CopilotChatView,
            RegisterReleaseRenderer,
            WhyRenderToolMatters,
        },
        setup() {
            return {
                messages: toolCallMessages,
            };
        },
        template: `
      <StoryCopilotProvider>
        <RegisterReleaseRenderer />
                <WhyRenderToolMatters />
        <div style="width: 440px; height: 520px;">
          <CopilotChatView :messages="messages" :suggestions="[]" :is-running="false" />
        </div>
      </StoryCopilotProvider>
    `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId("why-render-tool")).toBeTruthy();
        await expect(canvas.getByTestId("custom-render-tool")).toBeTruthy();
        await expect(canvas.getByText("Release Note Tool")).toBeTruthy();
        await expect(canvas.getByText(/status: complete/)).toBeTruthy();
        await expect(canvas.getByText(/repo: copilotkit-vue/)).toBeTruthy();
    },
};

export const CustomRendererInProgress: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Wildcard renderer example: catches any tool name and shows status while running. " +
                    "Use this as a safety net so unknown or newly added tools still render consistently.",
            },
        },
    },
    render: () => ({
        components: {
            StoryCopilotProvider,
            CopilotChatView,
            RegisterWildcardRenderer,
            WhyRenderToolMatters,
        },
        setup() {
            return {
                messages: runningToolCallMessages,
            };
        },
        template: `
      <StoryCopilotProvider>
        <RegisterWildcardRenderer />
                <WhyRenderToolMatters />
        <div style="width: 440px; height: 520px;">
          <CopilotChatView :messages="messages" :suggestions="[]" :is-running="true" />
        </div>
      </StoryCopilotProvider>
    `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId("why-render-tool")).toBeTruthy();
        await expect(canvas.getByTestId("wildcard-render-tool")).toBeTruthy();
        await expect(canvas.getByText("Wildcard Tool Renderer")).toBeTruthy();
        await expect(canvas.getByText(/tool: generate_release_note/)).toBeTruthy();
        await expect(canvas.getByText(/status: in-progress/)).toBeTruthy();
    },
};
