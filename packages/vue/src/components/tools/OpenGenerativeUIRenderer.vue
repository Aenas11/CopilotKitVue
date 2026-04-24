<script setup lang="ts">
/**
 * OpenGenerativeUIRenderer — sandboxed iframe renderer for generated HTML/CSS/JS.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
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

const iframeRef = ref<HTMLIFrameElement | null>(null);
const autoHeight = ref<number | null>(null);
const iframeMessageId = `ogui-${Math.random().toString(36).slice(2, 10)}`;
const fallbackTimer = ref<number | null>(null);

const effectiveTitle = computed(() => props.title);
const initialHeight = computed(() => props.content?.initialHeight ?? props.minHeight);
/**
 * Height reporting is enabled once generation is complete.
 * When using raw props (no content prop), content is always pre-baked so height can always be applied.
 */
const heightEnabled = computed(() => {
    if (!props.content) {
        return true; // raw-props mode: content is pre-baked, always accept measurements
    }
    return props.content.generating === false;
});
const isGenerating = computed(() => {
    if (!props.content) {
        return false;
    }
    return props.content.generating !== false;
});
const resolvedHeight = computed(() => `${autoHeight.value ?? initialHeight.value}px`);

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

/**
 * Height-reporter script injected into every sandboxed iframe.
 * Posts scrollHeight to parent via postMessage; also installs a ResizeObserver
 * so dynamic content changes (e.g. JS-driven layout) keep the host in sync.
 */
const HEIGHT_REPORTER = `(function(){
    var MESSAGE_ID='${iframeMessageId}';
  function report(){
    var h=Math.max(
      document.body?document.body.scrollHeight:0,
      document.documentElement.scrollHeight
    );
        if(h>0)window.parent.postMessage({type:'copilotkit-ogui-height',id:MESSAGE_ID,height:h},'*');
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',report);}
  else{report();}
  window.addEventListener('load',report);
    window.addEventListener('message',function(e){if(e.data&&e.data.type==='copilotkit-ogui-measure'&&e.data.id===MESSAGE_ID)report();});
  if(typeof ResizeObserver!=='undefined'){
    new ResizeObserver(report).observe(document.documentElement);
  }
})();`.trim();

const srcdoc = computed(() => {
    const safeTitle = escapeHtml(effectiveTitle.value);
    const userScript = finalScript.value
        ? `try{${finalScript.value}}catch(e){console.error('[OpenGenerativeUIRenderer] script error',e);}` : "";
    return [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${safeTitle}</title>`,
        "<style>html,body{margin:0;padding:0;}</style>",
        "</head>",
        frameHtml.value,
        `<script>${HEIGHT_REPORTER}${userScript ? "\n" + userScript : ""}<\\/script>`,
        "</html>",
    ].join("");
});

function onMessage(event: MessageEvent) {
    if (event.data?.type !== "copilotkit-ogui-height") {
        return;
    }
    if (event.data?.id !== iframeMessageId) {
        return;
    }
    if (!heightEnabled.value) {
        return; // still generating — ignore until content settles
    }
    const h = Math.ceil(Number(event.data.height));
    if (h > 0) {
        autoHeight.value = h;
        clearFallbackTimer();
    }
}

function requestMeasure() {
    const win = iframeRef.value?.contentWindow;
    if (win) {
        win.postMessage({ type: "copilotkit-ogui-measure", id: iframeMessageId }, "*");
    }
}

function clearFallbackTimer() {
    if (fallbackTimer.value !== null) {
        window.clearTimeout(fallbackTimer.value);
        fallbackTimer.value = null;
    }
}

function estimateFallbackHeight(): number {
    const html = fullHtml.value || previewBody.value || "";
    const blockCount = (html.match(/<(div|section|article|p|ul|ol|li|dl|table|tr|h[1-6]|form|fieldset)\b/gi) ?? []).length;
    const lineBreaks = (html.match(/<br\b/gi) ?? []).length;
    const textLength = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;

    // Compact baseline + bounded density estimate.
    const estimatedExtra = Math.min(
        220,
        blockCount * 18 + lineBreaks * 10 + Math.ceil(textLength / 160) * 14,
    );
    return Math.max(initialHeight.value, Math.min(520, initialHeight.value + estimatedExtra));
}

function scheduleFallbackHeight() {
    clearFallbackTimer();
    fallbackTimer.value = window.setTimeout(() => {
        if (!heightEnabled.value || autoHeight.value !== null) {
            return;
        }
        // Robust fallback when sandbox messaging does not return a height.
        // Prefer slightly extra whitespace over clipped generated UI.
        autoHeight.value = estimateFallbackHeight();
    }, 220);
}

function handleIframeLoad() {
    requestMeasure();
    scheduleFallbackHeight();
}

onMounted(() => {
    window.addEventListener("message", onMessage);
    // Race guard: iframe may have loaded before listener attach; request twice.
    requestMeasure();
    setTimeout(() => requestMeasure(), 60);
    scheduleFallbackHeight();
});
onBeforeUnmount(() => {
    window.removeEventListener("message", onMessage);
    clearFallbackTimer();
});

// Reset measured height whenever generation begins again
watch(
    () => isGenerating.value,
    (generating) => {
        if (generating) {
            autoHeight.value = null;
            clearFallbackTimer();
        }
    },
);

// When heightEnabled flips to true (generation finished), ask the iframe to re-report.
// The iframe's load event may have fired while still generating, so postMessage back
// to trigger a fresh measurement from the already-loaded document.
watch(
    () => heightEnabled.value,
    (enabled) => {
        if (!enabled) return;
        requestMeasure();
        scheduleFallbackHeight();
    },
);

watch(
    () => srcdoc.value,
    () => {
        if (!heightEnabled.value) {
            return;
        }
        nextTick(() => {
            requestMeasure();
            setTimeout(() => requestMeasure(), 60);
            scheduleFallbackHeight();
        });
    },
);

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
    <div class="copilotkit-ogui-renderer" :style="{ minHeight: resolvedHeight }">
        <iframe ref="iframeRef" class="copilotkit-ogui-renderer__iframe" :srcdoc="srcdoc" sandbox="allow-scripts"
            scrolling="no" referrerpolicy="no-referrer" :title="effectiveTitle" :style="{ height: resolvedHeight }"
            @load="handleIframeLoad" />
        <div v-if="isGenerating" class="copilotkit-ogui-renderer__overlay">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                class="copilotkit-ogui-renderer__spinner cpk-spin">
                <circle cx="12" cy="12" r="10" stroke="#e0e0e0" stroke-width="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#999" stroke-width="3" stroke-linecap="round" />
            </svg>
        </div>
    </div>
</template>
