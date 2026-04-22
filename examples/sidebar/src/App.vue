<script setup lang="ts">
/**
 * Sidebar & Popup example.
 *
 * Demonstrates:
 *  - <CopilotSidebar> — slide-in panel from the right with toggle button
 *  - <CopilotPopup>   — floating bottom-right chat bubble
 *
 * Toggle between modes using the radio buttons.
 *
 * ▸ Set VITE_COPILOTKIT_RUNTIME_URL in .env.local, then:
 *     pnpm --filter @copilotkit/example-sidebar dev
 */
import { ref } from "vue";
import {
    CopilotKitProvider,
    CopilotSidebar,
    CopilotPopup,
} from "@copilotkit/vue";
import "@copilotkit/vue/styles";

const runtimeUrl =
    import.meta.env.VITE_COPILOTKIT_RUNTIME_URL ?? "/api/copilotkit";
const agentId = import.meta.env.VITE_COPILOTKIT_AGENT_ID ?? "my_agent";

type Mode = "sidebar" | "popup";
const mode = ref<Mode>("sidebar");
</script>

<template>
    <CopilotKitProvider :runtime-url="runtimeUrl">
        <!-- Mode switcher (demo UI only) -->
        <div class="mode-bar">
            <span>Mode:</span>
            <label>
                <input v-model="mode" type="radio" value="sidebar" />
                Sidebar
            </label>
            <label>
                <input v-model="mode" type="radio" value="popup" />
                Popup
            </label>
        </div>

        <!-- App content -->
        <main class="app-content">
            <h1>My App</h1>
            <p>
                Click the floating button
                <template v-if="mode === 'sidebar'">(bottom-right ›)</template>
                <template v-else>(bottom-right bubble)</template>
                to open the assistant.
            </p>
            <p>
                Current mode: <strong>{{ mode }}</strong>
            </p>
        </main>

        <!-- Sidebar mode -->
        <CopilotSidebar v-if="mode === 'sidebar'" :default-open="false" :labels="{
            title: 'Assistant',
            initial: 'Hello! What can I help you with?',
            placeholder: 'Ask anything…',
            modalHeaderTitle: 'AI Assistant',
        }" :agent-id="agentId" />

        <!-- Popup mode -->
        <CopilotPopup v-else :default-open="false" :labels="{
            title: 'Assistant',
            initial: 'Hi there! How can I help?',
            placeholder: 'Type a message…',
        }" :click-outside-to-close="true" :agent-id="agentId" />
    </CopilotKitProvider>
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

.mode-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1.5rem;
    background: #1e293b;
    color: #f8fafc;
    font-size: 0.875rem;
}

.mode-bar label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
}

.app-content {
    padding: 5rem 2rem 2rem;
}
</style>
