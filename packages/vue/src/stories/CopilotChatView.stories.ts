import type { Message } from "@ag-ui/client";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import CopilotChatView from "../components/chat/CopilotChatView.vue";

const messages: Message[] = [
    { id: "u1", role: "user", content: "Can you summarize this?" } as Message,
    { id: "a1", role: "assistant", content: "Absolutely. Share the content and I will summarize it." } as Message,
];

const meta = {
    title: "Chat/CopilotChatView",
    component: CopilotChatView,
    args: {
        messages,
        isRunning: false,
        inputPlaceholder: "Type a message...",
        suggestions: [
            { title: "What changed since yesterday?", message: "What changed since yesterday?", isLoading: false },
            { title: "Show pending tasks", message: "Show pending tasks", isLoading: false },
        ],
    },
} satisfies Meta<typeof CopilotChatView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const IdleWithMessages: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Can you summarize this?")).toBeTruthy();
        await expect(canvas.getByText("Absolutely. Share the content and I will summarize it.")).toBeTruthy();
    },
};

export const Loading: Story = {
    args: {
        isRunning: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("button", { name: "Stop generation" })).toBeTruthy();
    },
};

export const Empty: Story = {
    args: {
        messages: [],
        suggestions: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("How can I help you today?")).toBeTruthy();
    },
};
