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
        forceAudioFileTranscriptionEnabled: {
            type: Boolean,
            default: false,
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

        if (props.forceAudioFileTranscriptionEnabled) {
            const prototypeDescriptor = Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(copilotkit),
                "audioFileTranscriptionEnabled",
            );

            Object.defineProperty(copilotkit, "audioFileTranscriptionEnabled", {
                configurable: true,
                get() {
                    const runtimeValue = prototypeDescriptor?.get?.call(copilotkit) ?? false;
                    return runtimeValue || true;
                },
            });
        }

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
    const isLiveStory = Array.isArray(context.tags) && context.tags.includes("live-agent");
    const showPurpose = context.viewMode === "story" && purposeText.length > 0;
    const showHowToUse = context.viewMode === "story" && isLiveStory;

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
                showHowToUse,
                showPurpose,
            };
        },
        template: `
          <div style="position: relative;">

            <RenderedStory />
          </div>
        `,
    };
};