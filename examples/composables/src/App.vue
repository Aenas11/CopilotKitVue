<script setup lang="ts">
/**
 * Composables example — build a fully custom chat UI using only composables.
 *
 * Demonstrates:
 *  - useCopilotChat     — send messages, get reactive messages list
 *  - useCopilotReadable — register reactive context for the AI
 *  - useFrontendTool    — register a client-side tool the AI can call
 *
 * ▸ Set VITE_COPILOTKIT_RUNTIME_URL in .env.local, then:
 *     pnpm --filter @copilotkit/example-composables dev
 */
import { ref } from "vue";
import { z } from "zod";
import {
    useCopilotChat,
    useAgentContext,
    useFrontendTool,
} from "@copilotkit/vue";
import "@copilotkit/vue/styles";

// ── App state the AI should be aware of ──────────────────────────────────────
const currentPage = ref("Dashboard");
const userName = ref("Alice");
const agentId = import.meta.env.VITE_COPILOTKIT_AGENT_ID ?? "my_agent";
const submitHint = ref<string | null>(null);

// ── Composables ───────────────────────────────────────────────────────────────
// This component is mounted inside CopilotKitProvider (see ChatDemo below),
// so the composables have access to the injected context.

const { messages, sendMessage, stop, isLoading, error } = useCopilotChat({
    agentId,
});

// Make app state readable by the AI
useAgentContext({
    description: "The page the user is currently viewing",
    value: currentPage,
});

useAgentContext({
    description: "The name of the logged-in user",
    value: userName,
});

// Register a tool the AI can call to fetch current app state
useFrontendTool({
    name: "get_app_state",
    description:
        "Get the current app state (active page and logged-in user). Call this when the user asks what page they are on or asks for their name.",
    agentId,
    handler: async () => ({
        currentPage: currentPage.value,
        userName: userName.value,
    }),
});

// Register a tool the AI can call to navigate pages
useFrontendTool({
    name: "navigate",
    description: "Navigate the user to a different page",
    agentId,
    parameters: z.object({
        page: z.string(),
    }),
    handler: async ({ page }: { page: string }) => {
        currentPage.value = page;
        return `Navigated to ${page}`;
    },
});

// ── Custom UI state ───────────────────────────────────────────────────────────
const inputText = ref("");

function handleSubmit() {
    void submit();
}

async function submit() {
    const text = inputText.value.trim();
    if (!text || isLoading.value) return;

    submitHint.value = null;

    inputText.value = "";
    await sendMessage(text);
}

function shouldRenderMessage(msg: { role: string; content?: unknown; toolCalls?: unknown[] }) {
    if (msg.role !== "assistant") {
        return true;
    }

    const hasToolCalls = Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0;
    const hasVisibleContent =
        typeof msg.content === "string"
            ? msg.content.trim().length > 0
            : msg.content != null;

    return !hasToolCalls || hasVisibleContent;
}
</script>

<template>
    <div class="demo">
        <!-- Sidebar: app state -->
        <aside class="sidebar">
            <h2>App State</h2>
            <p><strong>User:</strong> {{ userName }}</p>
            <p><strong>Page:</strong> {{ currentPage }}</p>
            <hr />
            <p class="hint">These values are registered via <code>useAgentContext</code> and forwarded to the backend
                agent. Ask it "what page am I on?" or "navigate me to Settings".</p>
        </aside>

        <!-- Main: custom chat UI built with composables -->
        <main class="chat">
            <header class="chat-header">
                <h1>Custom Chat (composables only)</h1>
                <p class="subtitle">No <code>&lt;CopilotChat&gt;</code> component — built entirely from
                    <code>useCopilotChat</code>.
                </p>
            </header>

            <div class="chat-messages">
                <template v-for="(msg, i) in messages" :key="i">
                    <template v-if="shouldRenderMessage(msg)">
                        <!-- User messages -->
                        <div v-if="msg.role === 'user'" class="message message--user">
                            <span class="message__role">You</span>
                            <div class="message__body">
                                {{ typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }}
                            </div>
                        </div>

                        <!-- Assistant messages -->
                        <div v-else-if="msg.role === 'assistant'" class="message message--assistant">
                            <span class="message__role">AI</span>
                            <div class="message__body">
                                {{ typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }}
                            </div>
                        </div>
                    </template>
                </template>

                <!-- Loading indicator -->
                <div v-if="isLoading" class="message message--loading">
                    <span class="message__role">AI</span>
                    <div class="message__body thinking">Thinking…</div>
                </div>

                <!-- Empty state -->
                <div v-if="!messages?.length && !isLoading" class="empty-state">
                    Send a message to start the conversation.
                </div>
            </div>

            <!-- Error banner -->
            <div v-if="error" class="error-banner">
                Error: {{ error.message }}
            </div>
            <div v-if="submitHint" class="error-banner">
                {{ submitHint }}
            </div>

            <!-- Input -->
            <form class="chat-input" @submit.prevent="handleSubmit">
                <textarea v-model="inputText" rows="1" placeholder="Type a message…" :disabled="isLoading"
                    @keydown.enter.exact.prevent="handleSubmit" />
                <button v-if="!isLoading" type="submit" :disabled="!inputText.trim()">
                    Send
                </button>
                <button v-else type="button" class="btn-stop" @click="stop">
                    Stop
                </button>
            </form>
        </main>
    </div>
</template>

<style>
*,
*::before,
*::after {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #f8f9fa;
}

.demo {
    display: flex;
    height: 100dvh;
}

/* ── Sidebar ── */
.sidebar {
    width: 260px;
    padding: 1.5rem;
    background: #1e293b;
    color: #f8fafc;
    overflow-y: auto;
}

.sidebar h2 {
    margin: 0 0 1rem;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
}

.sidebar hr {
    border: none;
    border-top: 1px solid #334155;
    margin: 1rem 0;
}

.sidebar .hint {
    font-size: 0.8rem;
    color: #94a3b8;
    line-height: 1.5;
}

.sidebar code {
    background: #334155;
    border-radius: 3px;
    padding: 0 3px;
    font-size: 0.75rem;
}

/* ── Chat panel ── */
.chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
}

.chat-header h1 {
    margin: 0;
    font-size: 1.125rem;
}

.chat-header .subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #64748b;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.empty-state {
    margin: auto;
    color: #94a3b8;
    font-size: 0.9rem;
}

/* ── Messages ── */
.message {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 75%;
}

.message--user {
    align-self: flex-end;
    align-items: flex-end;
}

.message--assistant,
.message--loading {
    align-self: flex-start;
    align-items: flex-start;
}

.message__role {
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.message__body {
    padding: 0.6rem 0.875rem;
    border-radius: 12px;
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
}

.message--user .message__body {
    background: #3b82f6;
    color: #fff;
    border-bottom-right-radius: 4px;
}

.message--assistant .message__body {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
}

.thinking {
    color: #94a3b8;
    font-style: italic;
}

/* ── Error ── */
.error-banner {
    margin: 0 1.5rem;
    padding: 0.6rem 1rem;
    background: #fee2e2;
    color: #b91c1c;
    border-radius: 8px;
    font-size: 0.85rem;
}

/* ── Input ── */
.chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: #fff;
}

.chat-input textarea {
    flex: 1;
    resize: none;
    padding: 0.6rem 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
    outline: none;
    transition: border-color 0.15s;
}

.chat-input textarea:focus {
    border-color: #3b82f6;
}

.chat-input button {
    padding: 0.6rem 1.25rem;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
}

.chat-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.chat-input button:not(:disabled):hover {
    background: #2563eb;
}

.btn-stop {
    background: #ef4444 !important;
}

.btn-stop:hover {
    background: #dc2626 !important;
}
</style>
