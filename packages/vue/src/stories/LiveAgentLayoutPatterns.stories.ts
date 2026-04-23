import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotSidebar from "../components/chat/CopilotSidebar.vue";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Advanced Scenarios/Layout Patterns",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: liveAgentAdvancedParameters,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SidebarAndChatCombo: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates sidebar chat behavior in realistic layouts. " +
                    "Use this to confirm open-close lifecycle, continuity, and UX integration with host app content.",
            },
        },
    },
    render: () => ({
        components: {
            CopilotSidebar,
            StoryRuntimeProvider,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-sidebar">
            <div style="height: 100vh; padding: 24px; background: #f9f9f9;">
              <h1>Main Application Content</h1>
              <p style="max-width: 600px; line-height: 1.6; color: #666;">
                Click the chat icon in the bottom-right corner to open the AI assistant sidebar.
                You can have conversations with the agent without interrupting your main workflow.
                The sidebar maintains conversation history and can be closed and reopened as needed.
              </p>
              <div style="margin-top: 24px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #ddd;">
                <h3>Features</h3>
                <ul style="color: #666;">
                  <li>Chat with AI agent</li>
                  <li>Receive contextual suggestions</li>
                  <li>Get help without leaving the page</li>
                </ul>
              </div>
              <CopilotSidebar
                agent-id="my_agent"
                :default-open="false"
                :width="460"
                :labels="{
                  title: 'AI Assistant',
                  placeholder: 'Ask for help...'
                }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

export const SuggestionsDemo: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: exercises compact embedding scenarios under constrained layout. " +
                    "Use this to verify readability and interaction quality in smaller containers.",
            },
        },
    },
    render: () => ({
        components: {
            CopilotChat,
            StoryRuntimeProvider,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-compact">
            <div style="width: 350px; height: 500px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <CopilotChat
                agent-id="my_agent"
                :labels="{
                  title: 'Quick Chat',
                  placeholder: 'Ask...'
                }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

export const ErrorHandling: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates chat behavior inside split-pane apps where content and assistant coexist. " +
                    "Use this to confirm layout resilience and interaction quality in composite UIs.",
            },
        },
    },
    render: () => ({
        components: {
            CopilotChat,
            StoryRuntimeProvider,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-split">
            <div style="display: flex; height: 100vh;">
              <div style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid #ddd;">
                <CopilotChat
                  agent-id="my_agent"
                  :labels="{
                    title: 'Chat',
                    placeholder: 'Ask a question...'
                  }"
                />
              </div>
              <aside style="width: 280px; padding: 20px; background: #f5f5f5; overflow-y: auto;">
                <h3>Information Panel</h3>
                <div style="font-size: 13px; color: #666; line-height: 1.6;">
                  <p><strong>Chat Topics:</strong></p>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>General questions</li>
                    <li>Proverbs and wisdom</li>
                    <li>Context-aware advice</li>
                  </ul>
                  <p style="margin-top: 16px; padding: 12px; background: white; border-radius: 4px; border-left: 4px solid #0066cc;">
                    <strong>Tip:</strong> Ask the agent about specific topics, and it will provide contextual responses.
                  </p>
                </div>
              </aside>
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

export const MinimalComposableUI: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: baseline full-screen chat scenario for dedicated assistant surfaces. " +
                    "Use this as a reference when validating default chat ergonomics without surrounding app chrome.",
            },
        },
    },
    render: () => ({
        components: {
            CopilotChat,
            StoryRuntimeProvider,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-fullscreen">
            <CopilotChat
              agent-id="my_agent"
              :labels="{
                title: 'AI Assistant',
                placeholder: 'How can I help you today?'
              }"
            />
          </StoryRuntimeProvider>
        `,
    }),
};