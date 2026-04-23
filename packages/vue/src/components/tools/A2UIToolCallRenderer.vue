<script setup lang="ts">
import { computed } from "vue";
import type { ToolCallRenderStatus } from "../../adapters/toolCallRenderRegistry";

interface A2UIArgs {
    items?: unknown[];
    components?: unknown[];
}

const props = defineProps<{
    status: ToolCallRenderStatus;
    args?: unknown;
}>();

const parsedArgs = computed<A2UIArgs>(() => {
    if (!props.args || typeof props.args !== "object") return {};
    return props.args as A2UIArgs;
});

const shouldHide = computed(() => {
    if (props.status === "complete") return true;
    const items = parsedArgs.value.items;
    if (Array.isArray(items) && items.length > 0) return true;
    const components = parsedArgs.value.components;
    if (Array.isArray(components) && components.length > 2) return true;
    return false;
});

const tokenEstimate = computed(() => {
    const raw = JSON.stringify(props.args ?? {});
    return Math.round(raw.length / 4);
});

const phase = computed(() => {
    const tokens = tokenEstimate.value;
    if (tokens < 50) return 0;
    if (tokens < 200) return 1;
    if (tokens < 400) return 2;
    return 3;
});
</script>

<template>
    <div v-if="!shouldHide" class="cpk-a2ui-progress-wrap" data-testid="cpk-a2ui-progress">
        <div class="cpk-a2ui-card">
            <div class="cpk-a2ui-topbar">
                <div class="cpk-a2ui-dots">
                    <span class="cpk-a2ui-dot" />
                    <span class="cpk-a2ui-dot" />
                    <span class="cpk-a2ui-dot" />
                </div>
                <span class="cpk-a2ui-pill cpk-a2ui-pill--top" :class="{ 'cpk-a2ui-faded': phase < 1 }" />
            </div>

            <div class="cpk-a2ui-rows">
                <div class="cpk-a2ui-row">
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-blue" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--md cpk-a2ui-light-blue" />
                </div>
                <div class="cpk-a2ui-row">
                    <span class="cpk-a2ui-spacer" />
                    <span class="cpk-a2ui-dot" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--lg cpk-a2ui-muted" />
                </div>

                <div class="cpk-a2ui-row" :class="{ 'cpk-a2ui-hidden': phase < 1 }">
                    <span class="cpk-a2ui-spacer" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-muted" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--xs cpk-a2ui-teal" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-blue" />
                </div>
                <div class="cpk-a2ui-row" :class="{ 'cpk-a2ui-hidden': phase < 2 }">
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-teal" />
                    <span class="cpk-a2ui-dot" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-muted" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--md cpk-a2ui-blue" />
                </div>
                <div class="cpk-a2ui-row" :class="{ 'cpk-a2ui-hidden': phase < 3 }">
                    <span class="cpk-a2ui-dot" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-muted" />
                    <span class="cpk-a2ui-dot" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-teal" />
                    <span class="cpk-a2ui-pill cpk-a2ui-pill--sm cpk-a2ui-blue" />
                </div>
            </div>

            <div class="cpk-a2ui-sweep" />
        </div>

        <div class="cpk-a2ui-label-row">
            <span class="cpk-a2ui-label">Building interface</span>
            <span v-if="tokenEstimate > 0" class="cpk-a2ui-tokens">~{{ tokenEstimate.toLocaleString() }} tokens</span>
        </div>
    </div>
</template>
