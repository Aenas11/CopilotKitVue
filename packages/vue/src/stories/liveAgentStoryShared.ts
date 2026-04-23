import type { Decorator } from "@storybook/vue3-vite";
import { CopilotKitCore } from "@copilotkit/core";
import { defineComponent, provide, ref } from "vue";
import { CopilotKitKey, type CopilotKitContext } from "../providers/keys";

export const StoryRuntimeProvider = defineComponent({
    name: "StoryRuntimeProvider",
    props: {
        runtimeUrl: {
            type: String,
            required: true,
        },
        threadId: {
            type: String,
            default: undefined,
        },
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

export const liveAgentAdvancedParameters = {
    layout: "fullscreen",
    docs: {
        description: {
            component:
                "Live advanced feature demonstrations backed by a real runtime and agent. " +
                "These scenarios validate production-like behavior that unit tests cannot fully cover: shared state sync, tool invocation side effects, thread continuity, render-tool UX, and composable interoperability.",
        },
    },
};

export const liveAgentPurposeDecorator: Decorator = (story, context) => {
    const renderedStory = story();
    const storyDescription = context.parameters?.docs?.description?.story;
    const purposeText = typeof storyDescription === "string" ? storyDescription : "";
    const showPurpose = context.viewMode === "story" && purposeText.length > 0;

    return {
        components: {
            RenderedStory: renderedStory as never,
        },
        setup() {
            const dismissed = ref(false);

            const dismiss = () => {
                dismissed.value = true;
            };

            return {
                dismiss,
                dismissed,
                purposeText,
                showPurpose,
            };
        },
        template: `
          <div style="position: relative;">
            <div
              v-if="showPurpose && !dismissed"
              style="position: fixed; top: 12px; right: 12px; z-index: 50; max-width: 430px; background: rgba(255, 255, 255, 0.96); border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14); font-size: 12px; line-height: 1.45; color: #111827;"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <div style="font-weight: 700; color: #1d4ed8;">Scenario Purpose</div>
                <button
                  type="button"
                  aria-label="Dismiss scenario purpose"
                  @click="dismiss"
                  style="border: 1px solid #d1d5db; background: #fff; color: #4b5563; border-radius: 6px; cursor: pointer; font-size: 11px; line-height: 1; padding: 4px 6px;"
                >
                  Close
                </button>
              </div>
              <div>{{ purposeText }}</div>
            </div>
            <RenderedStory />
          </div>
        `,
    };
};