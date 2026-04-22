import { createApp, defineComponent, h } from "vue";
import { CopilotKitProvider } from "copilotkit-vue";
import App from "./App.vue";

/**
 * Wrap App in CopilotKitProvider at the root so all composables inside
 * App.vue (useCopilotChat, useCopilotReadable, useFrontendTool) have access
 * to the injected CopilotKit context.
 */
const runtimeUrl =
    import.meta.env.VITE_COPILOTKIT_RUNTIME_URL ?? "/api/copilotkit";

const Root = defineComponent({
    setup() {
        return () =>
            h(
                CopilotKitProvider,
                {
                    runtimeUrl,
                },
                { default: () => h(App) },
            );
    },
});

createApp(Root).mount("#app");
