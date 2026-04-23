import type { Preview } from "@storybook/vue3-vite";
import "../src/styles/index.css";

const preview: Preview = {
    parameters: {
        layout: "centered",
        options: {
            storySort: {
                order: [
                    "Components",
                    ["Overview", "Chat", "Layout"],
                    "Scenarios",
                    ["Overview", "Deterministic"],
                    "Workflows",
                    ["Overview", "Live Agent", ["Basics", "Advanced Scenarios", ["State and Tools", "Threads and Debugging", "Layout Patterns", "Tool Rendering", "Generative UI"], "Checklist"]],
                ],
            },
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
