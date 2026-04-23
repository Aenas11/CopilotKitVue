import type { Preview } from "@storybook/vue3-vite";
import "../src/styles/index.css";

const preview: Preview = {
    parameters: {
        layout: "centered",
        options: {
            storySort: {
                order: [
                    "Components",
                    ["Chat", "Layout"],
                    "Scenarios",
                    ["Deterministic"],
                    "Workflows",
                    ["Live Agent"],
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
