import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, provide } from "vue";
import { CopilotKitCore } from "@copilotkit/core";
import CopilotChat from "../components/chat/CopilotChat.vue";
import CopilotSidebar from "../components/chat/CopilotSidebar.vue";
import { CopilotKitKey, type CopilotKitContext } from "../providers/keys";

const StoryRuntimeProvider = defineComponent({
    name: "StoryRuntimeProvider",
    props: {
        runtimeUrl: { type: String, required: true },
        threadId: { type: String, default: undefined },
    },
    setup(props, { slots }) {
        const copilotkit = new CopilotKitCore({
            runtimeUrl: props.runtimeUrl,
            headers: undefined,
            credentials: undefined,
            properties: undefined,
            agents__unsafe_dev_only: undefined,
        });

        const context: CopilotKitContext = {
            copilotkit,
            threadId: props.threadId,
            defaultThrottleMs: undefined,
        };

        provide(CopilotKitKey, context);
        return () => slots.default?.();
    },
});

const meta = {
    title: "Scenarios/Advanced Agent Features",
    tags: ["live-agent"],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "Live advanced feature demonstrations with real agent runtime.",
            },
        },
    },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Story 1: Context-Aware Chat
 * Standard CopilotChat interface optimized for context-aware conversations.
 * The agent runtime can access shared context about user state and page.
 */
export const ContextSharingChat: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-context-sharing">
            <div style="height: 100vh; max-width: 980px; margin: 0 auto; padding: 16px; box-sizing: border-box;">
              <CopilotChat
                agent-id="my_agent"
                :labels="{ 
                  title: 'Context-Aware Chat', 
                  placeholder: 'Ask about context, settings, or your current state...' 
                }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 2: Tool-Powered Chat
 * Chat interface where the agent can invoke client-side tools.
 * Tools might include counter operations, state updates, or UI interactions.
 */
export const FrontendToolsChat: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-frontend-tools">
            <div style="height: 100vh; max-width: 980px; margin: 0 auto; padding: 16px; box-sizing: border-box;">
              <CopilotChat
                agent-id="my_agent"
                :labels="{ 
                  title: 'Tool-Powered Chat', 
                  placeholder: 'Ask the agent to perform actions or read state...' 
                }"
              />
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 3: Multi-Thread Chat
 * Three independent conversation threads (A, B, C).
 * Switch between threads to maintain separate histories and contexts.
 */
export const MultiThreadChat: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        data() {
            return {
                activeThread: "a" as "a" | "b" | "c",
                threadLabels: {
                    a: "General Chat",
                    b: "Proverbs Only",
                    c: "Questions",
                },
            };
        },
        template: `
          <div style="display: flex; height: 100vh; flex-direction: column;">
            <div style="display: flex; gap: 8px; padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
              <button
                v-for="id in ['a', 'b', 'c']"
                :key="id"
                @click="activeThread = id"
                :style="{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: activeThread === id ? '#0066cc' : '#ddd',
                  color: activeThread === id ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: activeThread === id ? 'bold' : 'normal',
                }"
              >
                Thread {{ id.toUpperCase() }}: {{ threadLabels[id] }}
              </button>
            </div>
            <StoryRuntimeProvider :runtime-url="'/api/copilotkit'" :thread-id="'story-thread-' + activeThread">
              <main style="flex: 1; overflow: hidden;">
                <CopilotChat
                  :key="activeThread"
                  agent-id="my_agent"
                  :labels="{ 
                    title: 'Thread ' + activeThread.toUpperCase(),
                    placeholder: 'Continue this thread conversation...' 
                  }"
                />
              </main>
            </StoryRuntimeProvider>
          </div>
        `,
    }),
};

/**
 * Story 4: Custom Minimal Chat
 * Demonstrates building a minimal chat UI with custom styling.
 * Shows how to compose CopilotChat with supporting UI elements.
 */
export const AgentStateInspection: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-minimal-custom">
            <div style="display: flex; flex-direction: column; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <div style="padding: 24px; color: white; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; margin-bottom: 8px;">Custom Styled Chat</h1>
                <p style="margin: 0; opacity: 0.9;">This demonstrates custom theming and layout with CopilotChat.</p>
              </div>
              <div style="flex: 1; background: white; margin: 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <CopilotChat
                  agent-id="my_agent"
                  :labels="{ 
                    title: 'Chat', 
                    placeholder: 'Type a message...' 
                  }"
                />
              </div>
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 5: Sidebar Integration
 * CopilotSidebar used as a collapsible help panel.
 * Opens/closes independently from main content.
 */
export const SidebarAndChatCombo: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotSidebar,
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" thread-id="story-sidebar">
            <div style="height: 100vh; padding: 24px; background: #f9f9f9;">
              <h1>Main Application Content</h1>
              <p style="max-width: 600px; line-height: 1.6; color: #666;">
                Click the chat icon in the bottom-right corner to open the AI assistant sidebar. 
                You can have conversations with the agent without interrupting your main workflow. 
                The sidebar maintains conversation history and can be closed/reopened as needed.
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

/**
 * Story 6: Suggestions Demo
 * Minimal, compact chat interface ideal for embedded scenarios.
 * Uses smaller font sizes and reduced padding.
 */
export const SuggestionsDemo: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
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

/**
 * Story 7: Error Handling
 * Two-column layout with main chat and information panel.
 * Demonstrates integrating CopilotChat within a larger UI.
 */
export const ErrorHandling: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
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
                    <li>Proverbs &amp; wisdom</li>
                    <li>Context-aware advice</li>
                  </ul>
                  <p style="margin-top: 16px; padding: 12px; background: white; border-radius: 4px; border-left: 4px solid #0066cc;">
                    💡 <strong>Tip:</strong> Ask the agent about specific topics, and it will provide contextual responses.
                  </p>
                </div>
              </aside>
            </div>
          </StoryRuntimeProvider>
        `,
    }),
};

/**
 * Story 8: Minimal Composable UI
 * Maximalist chat experience covering entire viewport.
 * Best for dedicated chat applications.
 */
export const MinimalComposableUI: Story = {
    render: () => ({
        components: {
            StoryRuntimeProvider,
            CopilotChat,
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
