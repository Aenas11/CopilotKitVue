import CopilotChatInput from "../components/chat/CopilotChatInput.vue";

const meta = {
    title: "Chat/CopilotChatInput",
    component: CopilotChatInput,
    args: {
        placeholder: "Ask CopilotKit...",
    },
};

export default meta;

export const Idle = {
    args: {
        isRunning: false,
        disabled: false,
    },
};

export const Running = {
    args: {
        isRunning: true,
        disabled: false,
    },
};

export const Disabled = {
    args: {
        isRunning: false,
        disabled: true,
    },
};
