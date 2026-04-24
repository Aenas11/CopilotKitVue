<script setup lang="ts">
/**
 * OpenGenerativeUIRenderer — sandboxed iframe renderer for generated HTML/CSS/JS.
 */
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        html?: string;
        css?: string;
        js?: string;
        title?: string;
        minHeight?: number;
    }>(),
    {
        html: "",
        css: "",
        js: "",
        title: "Open Generative UI",
        minHeight: 220,
    },
);

const srcdoc = computed(() => {
    const safeTitle = escapeHtml(props.title);
    return [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${safeTitle}</title>`,
        `<style>${props.css}</style>`,
        "</head>",
        "<body>",
        props.html,
        `<script>try {${props.js}} catch (error) {console.error('[OpenGenerativeUIRenderer] script error', error);}<\\/script>`,
        "</body>",
        "</html>",
    ].join("");
});

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
</script>

<template>
    <div class="copilotkit-ogui-renderer">
        <iframe class="copilotkit-ogui-renderer__iframe" :style="{ minHeight: `${minHeight}px` }" :srcdoc="srcdoc"
            sandbox="allow-scripts" referrerpolicy="no-referrer" :title="title" />
    </div>
</template>
