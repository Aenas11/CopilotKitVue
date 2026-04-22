import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: [
            {
                find: /^copilotkit-vue\/styles$/,
                replacement: fileURLToPath(new URL("../../packages/vue/src/styles/index.css", import.meta.url)),
            },
            {
                find: /^copilotkit-vue$/,
                replacement: fileURLToPath(new URL("../../packages/vue/src/index.ts", import.meta.url)),
            },
        ],
    },
    server: {
        port: 5174,
        proxy: {
            "/api/copilotkit": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
        },
    },
});
