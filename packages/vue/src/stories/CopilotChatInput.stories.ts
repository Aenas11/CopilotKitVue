import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import CopilotChatInput from "../components/chat/CopilotChatInput.vue";

const meta = {
    title: "Chat/CopilotChatInput",
    component: CopilotChatInput,
    args: {
        placeholder: "Ask CopilotKit...",
    },
    tags: ["stable", "complex", "autodocs"],
} satisfies Meta<typeof CopilotChatInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {
    args: {
        isRunning: false,
        disabled: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByPlaceholderText("Ask CopilotKit...") as HTMLTextAreaElement;
        const sendButton = canvas.getByRole("button", { name: "Send message" });

        await expect(input.disabled).toBe(false);
        await expect(sendButton).toBeDisabled();

        await userEvent.type(input, "Hello from storybook test");
        await expect(sendButton).toBeEnabled();
    },
};

export const Running: Story = {
    args: {
        isRunning: true,
        disabled: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const stopButton = canvas.getByRole("button", { name: "Stop generation" });
        await expect(stopButton).toBeEnabled();
    },
};

export const Disabled: Story = {
    args: {
        isRunning: false,
        disabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByPlaceholderText("Ask CopilotKit...") as HTMLTextAreaElement;
        const sendButton = canvas.getByRole("button", { name: "Send message" });

        await expect(input.disabled).toBe(true);
        await expect(sendButton).toBeDisabled();
    },
};
