import type { Message } from "@ag-ui/client";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import CopilotChatConfigurationProvider from "../providers/CopilotChatConfigurationProvider.vue";
import CopilotChatView from "../components/chat/CopilotChatView.vue";
import CopilotChatToggleButton from "../components/chat/CopilotChatToggleButton.vue";
import CopilotSidebarView from "../components/layout/CopilotSidebarView.vue";

const richMessages: Message[] = [
    { id: "u-rich", role: "user", content: "Show me a deployment checklist." } as Message,
    {
        id: "a-rich",
        role: "assistant",
        content:
            "### Deployment checklist\n\n- Validate env vars\n- Run `pnpm check-types`\n- Run smoke tests\n\n```bash\npnpm test:stories\n```",
    } as Message,
];

const streamingMessages: Message[] = [
    { id: "u-stream", role: "user", content: "Please think through rollout risks." } as Message,
];

const meta = {
    title: "Scenarios/Complex Chat",
    component: CopilotChatView,
    tags: ["stable"],
} satisfies Meta<typeof CopilotChatView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RichAssistantContent: Story = {
    args: {
        messages: richMessages,
        suggestions: [],
        isRunning: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Deployment checklist")).toBeTruthy();
        await expect(canvas.getByText("Validate env vars")).toBeTruthy();
        await expect(canvas.getByText("pnpm test:stories")).toBeTruthy();
    },
};

export const StreamingLastUserTurn: Story = {
    args: {
        messages: streamingMessages,
        suggestions: [],
        isRunning: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByLabelText("Thinking")).toBeTruthy();
        await expect(canvas.getByRole("button", { name: "Stop generation" })).toBeTruthy();
    },
};

export const SuggestionLoadingAndSelection: Story = {
    render: () => ({
        components: { CopilotChatView },
        setup() {
            const selectedSuggestion = ref("none");
            const suggestions = [
                { title: "Create rollout plan", message: "Create rollout plan", isLoading: false },
                { title: "Generate changelog", message: "Generate changelog", isLoading: true },
            ];

            function onSelectSuggestion(suggestion: { title: string }) {
                selectedSuggestion.value = suggestion.title;
            }

            return {
                messages: richMessages,
                suggestions,
                selectedSuggestion,
                onSelectSuggestion,
            };
        },
        template: `
          <div>
            <CopilotChatView
              :messages="messages"
              :suggestions="suggestions"
              :is-running="false"
              @select-suggestion="onSelectSuggestion"
            />
            <p data-testid="selected-suggestion">Selected: {{ selectedSuggestion }}</p>
          </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByText("Create rollout plan"));
        await expect(canvas.getByTestId("selected-suggestion").textContent).toContain("Create rollout plan");

        const loadingButton = canvas.getByText("Generate changelog").closest("button");
        await expect(loadingButton).toBeDisabled();
    },
};

export const SidebarReopenContinuity: Story = {
    render: () => ({
        components: {
            CopilotChatConfigurationProvider,
            CopilotChatToggleButton,
            CopilotSidebarView,
        },
        template: `
          <CopilotChatConfigurationProvider :is-modal-default-open="false" :labels="{ title: 'Assistant' }">
            <CopilotChatToggleButton />
            <CopilotSidebarView :width="420">
              <div style="padding: 12px;">Conversation context survives panel toggles</div>
            </CopilotSidebarView>
          </CopilotChatConfigurationProvider>
        `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole("button", { name: "Open chat" });

        await userEvent.click(toggle);
        await expect(canvasElement.querySelector(".cpk-sidebar.is-open")).toBeTruthy();

        const closeToggle = canvas.getByRole("button", { name: "Close chat" });
        await userEvent.click(closeToggle);
        await expect(canvasElement.querySelector(".cpk-sidebar.is-open")).toBeFalsy();

        await userEvent.click(canvas.getByRole("button", { name: "Open chat" }));
        await expect(canvas.getByText("Conversation context survives panel toggles")).toBeTruthy();
    },
};

export const ReasoningStreaming: Story = {
    args: {
        messages: [
            { id: "u-reason", role: "user", content: "Think step by step before answering." } as Message,
            { id: "r-reason", role: "reasoning", content: "Analyzing constraints and dependencies..." } as Message,
        ],
        isRunning: true,
        suggestions: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Thinking/)).toBeTruthy();
        await expect(canvas.getByText("Analyzing constraints and dependencies...")).toBeTruthy();
    },
};

export const InputRetryAfterFailure: Story = {
    args: {
        messages: [
            { id: "u-fail", role: "user", content: "Run deployment" } as Message,
            { id: "a-fail", role: "assistant", content: "I hit an error while contacting the backend. Please retry." } as Message,
        ],
        isRunning: false,
        suggestions: [
            { title: "Retry last request", message: "Retry last request", isLoading: false },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Please retry/)).toBeTruthy();

        const input = canvas.getByPlaceholderText("Ask me anything...");
        await userEvent.type(input, "Retry deployment with logs");
        await expect(canvas.getByRole("button", { name: "Send message" })).toBeEnabled();
    },
};