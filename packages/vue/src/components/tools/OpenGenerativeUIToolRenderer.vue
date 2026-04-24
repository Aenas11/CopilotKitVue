<script setup lang="ts">
/**
 * OpenGenerativeUIToolRenderer — maps tool payload fields into OpenGenerativeUIRenderer.
 */
import { computed } from "vue";
import OpenGenerativeUIRenderer from "./OpenGenerativeUIRenderer.vue";

interface OpenGenerativeUIToolPayload {
    html?: string;
    css?: string;
    js?: string;
    title?: string;
    minHeight?: number;
}

const props = withDefaults(
    defineProps<{
        payload?: OpenGenerativeUIToolPayload;
        fallbackTitle?: string;
    }>(),
    {
        payload: undefined,
        fallbackTitle: "Generated UI",
    },
);

const normalized = computed<Required<OpenGenerativeUIToolPayload>>(() => ({
    html: props.payload?.html ?? "",
    css: props.payload?.css ?? "",
    js: props.payload?.js ?? "",
    title: props.payload?.title ?? props.fallbackTitle,
    minHeight: props.payload?.minHeight ?? 220,
}));
</script>

<template>
    <div class="copilotkit-ogui-tool-renderer">
        <slot :payload="normalized">
            <OpenGenerativeUIRenderer :html="normalized.html" :css="normalized.css" :js="normalized.js"
                :title="normalized.title" :min-height="normalized.minHeight" />
        </slot>
    </div>
</template>
