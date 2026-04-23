import type { Message } from "@ag-ui/client";
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
            { title: "What changed since yesterday?", message: "What changed since yesterday?" },
            { title: "Show pending tasks", message: "Show pending tasks" },
        ],
    },
};

export default meta;

export const IdleWithMessages = {};

export const Loading = {
    args: {
        isRunning: true,
    },
};

export const Empty = {
    args: {
        messages: [],
        suggestions: [],
    },
};
