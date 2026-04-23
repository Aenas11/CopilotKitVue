import type { StorybookConfig } from "@storybook/vue3-vite";
import vue from "@vitejs/plugin-vue";

const addons: NonNullable<StorybookConfig["addons"]> = ["@storybook/addon-docs"];

if (process.env.STORYBOOK_ENABLE_VITEST === "true") {
    addons.push("@storybook/addon-vitest");
}

const config: StorybookConfig = {
    framework: {
        name: "@storybook/vue3-vite",
        options: {},
    },
    stories: ["../src/stories/**/*.stories.@(ts|mdx)"],
    addons,
    viteFinal: async (viteConfig) => {
        const hasVuePlugin = (viteConfig.plugins ?? []).some((plugin) => plugin?.name === "vite:vue");

        return {
            ...viteConfig,
            plugins: hasVuePlugin ? viteConfig.plugins : [...(viteConfig.plugins ?? []), vue()],
            server: {
                ...(viteConfig.server ?? {}),
                proxy: {
                    ...((viteConfig.server as { proxy?: Record<string, unknown> } | undefined)?.proxy ?? {}),
                    "/api/copilotkit": {
                        target: "http://localhost:4000",
                        changeOrigin: true,
                    },
                },
            },
        };
    },
};

export default config;
