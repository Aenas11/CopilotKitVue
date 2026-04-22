<script setup lang="ts">
/**
 * Basic example — inline CopilotChat panel.
 *
 * ▸ Set VITE_COPILOTKIT_RUNTIME_URL in .env.local (see README), e.g.:
 *
 *     VITE_COPILOTKIT_RUNTIME_URL=/api/copilotkit
 *
 * ▸ Run with:  pnpm --filter @copilotkit/example-basic dev
 */
import { CopilotKitProvider, CopilotChat } from "copilotkit-vue";
import "copilotkit-vue/styles";

const runtimeUrl =
    import.meta.env.VITE_COPILOTKIT_RUNTIME_URL ?? "/api/copilotkit";
</script>

<template>
    <CopilotKitProvider :runtime-url="runtimeUrl">
        <div class="demo-layout">
            <!-- Left: your normal app content -->
            <main class="demo-content">
                <h1>My App</h1>
                <p>This is your normal app. The chat panel is mounted inline on the right.</p>
            </main>

            <!-- Right: inline CopilotChat panel -->
            <aside class="demo-chat-panel">
                <!-- Must match the runtime agent key configured in runtime-server.mjs -->
                <CopilotChat :labels="{
                    title: 'Assistant',
                    initial: 'Hi! How can I help you today?',
                    placeholder: 'Ask me anything…',
                }" agent-id="my_agent" />
            </aside>
        </div>
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

.demo-layout {
    display: flex;
    height: 100dvh;
}

.demo-content {
    flex: 1;
    padding: 2rem;
}

.demo-chat-panel {
    width: 380px;
    border-left: 1px solid #e2e8f0;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
</style>
