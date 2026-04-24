<script setup lang="ts">
/**
 * OpenGenerativeUIRenderer — sandboxed iframe renderer for generated HTML/CSS/JS.
 */
import { computed } from "vue";
import {
    ensureHead,
    extractCompleteStyles,
    injectCssIntoHtml,
    processPartialHtml,
    type OpenGenerativeUIContent,
} from "./openGenerativeUi";

const props = withDefaults(
    defineProps<{
        html?: string;
        css?: string;
        js?: string;
        title?: string;
        minHeight?: number;
        content?: OpenGenerativeUIContent;
    }>(),
    {
        html: "",
        css: "",
        js: "",
        title: "Open Generative UI",
        minHeight: 220,
        content: undefined,
    },
);

const effectiveTitle = computed(() => props.title);
const initialHeight = computed(() => props.content?.initialHeight ?? props.minHeight);
const isGenerating = computed(() => {
    if (!props.content) {
        return false;
    }
    return props.content.generating !== false;
});

const fullHtml = computed(() => {
    if (props.content?.htmlComplete && props.content.html?.length) {
        return props.content.html.join("");
    }
    return props.html;
});

const effectiveCss = computed(() => {
    if (props.content) {
        return props.content.cssComplete ? (props.content.css ?? "") : "";
    }
    return props.css;
});

const previewHtml = computed(() => {
    if (!props.content || props.content.htmlComplete || !props.content.html?.length) {
        return "";
    }
    return props.content.html.join("");
});

const previewBody = computed(() => processPartialHtml(previewHtml.value));
const previewStyles = computed(() => extractCompleteStyles(previewHtml.value));

const finalScript = computed(() => {
    const blocks: string[] = [];
    if (props.content?.jsFunctions) {
        blocks.push(props.content.jsFunctions);
    }
    if (props.content?.jsExpressions?.length) {
        blocks.push(...props.content.jsExpressions);
    }
    if (props.js) {
        blocks.push(props.js);
    }
    return blocks.join("\n");
});

const hasRenderablePreview = computed(
    () => !!previewBody.value.trim() && !!effectiveCss.value,
);

const frameHtml = computed(() => {
    if (fullHtml.value) {
        return effectiveCss.value
            ? injectCssIntoHtml(ensureHead(fullHtml.value), effectiveCss.value)
            : ensureHead(fullHtml.value);
    }

    if (hasRenderablePreview.value) {
        return [
            "<head>",
            `<style>${effectiveCss.value}</style>`,
            previewStyles.value,
            "</head>",
            `<body>${previewBody.value}</body>`,
        ].join("");
    }

    return "";
});

const srcdoc = computed(() => {
    const safeTitle = escapeHtml(effectiveTitle.value);
    return [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${safeTitle}</title>`,
        "</head>",
        frameHtml.value,
        `<script>try {${finalScript.value}} catch (error) {console.error('[OpenGenerativeUIRenderer] script error', error);}<\\/script>`,
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
    <div class="copilotkit-ogui-renderer" :style="{ minHeight: `${initialHeight}px` }">
        <iframe class="copilotkit-ogui-renderer__iframe" :srcdoc="srcdoc" sandbox="allow-scripts"
            referrerpolicy="no-referrer" :title="effectiveTitle" />
        <div v-if="isGenerating" class="copilotkit-ogui-renderer__overlay">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                class="copilotkit-ogui-renderer__spinner cpk-spin">
                <circle cx="12" cy="12" r="10" stroke="#e0e0e0" stroke-width="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#999" stroke-width="3" stroke-linecap="round" />
            </svg>
        </div>
    </div>
</template>
