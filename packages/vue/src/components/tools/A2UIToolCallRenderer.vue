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

<style scoped>
.cpk-a2ui-progress-wrap {
    margin: 12px 0;
    max-width: 320px;
}

.cpk-a2ui-card {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(228, 228, 231, 0.8);
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    padding: 16px 18px 14px;
}

.cpk-a2ui-topbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.cpk-a2ui-dots {
    display: flex;
    gap: 4px;
}

.cpk-a2ui-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #d4d4d8;
    flex-shrink: 0;
}

.cpk-a2ui-pill {
    display: inline-block;
    border-radius: 9999px;
    height: 7px;
    animation: cpk-a2ui-fade 2.4s ease-in-out infinite;
}

.cpk-a2ui-pill--top {
    width: 64px;
    background: #e4e4e7;
    animation: none;
    transition: opacity 0.5s;
}

.cpk-a2ui-pill--xs {
    width: 40px;
}

.cpk-a2ui-pill--sm {
    width: 48px;
}

.cpk-a2ui-pill--md {
    width: 80px;
}

.cpk-a2ui-pill--lg {
    width: 100px;
}

.cpk-a2ui-blue {
    background: rgba(147, 197, 253, 0.7);
}

.cpk-a2ui-light-blue {
    background: rgba(219, 234, 254, 0.8);
}

.cpk-a2ui-teal {
    background: rgba(153, 246, 228, 0.6);
}

.cpk-a2ui-muted {
    background: rgba(24, 24, 27, 0.2);
}

.cpk-a2ui-faded {
    opacity: 0.4;
}

.cpk-a2ui-rows {
    display: grid;
    gap: 7px;
}

.cpk-a2ui-row {
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 1;
    transition: opacity 0.35s;
}

.cpk-a2ui-hidden {
    opacity: 0;
}

.cpk-a2ui-spacer {
    width: 12px;
}

.cpk-a2ui-sweep {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 60%,
            transparent 100%);
    background-size: 250% 100%;
    animation: cpk-a2ui-sweep 3s ease-in-out infinite;
}

.cpk-a2ui-label-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
}

.cpk-a2ui-label {
    font-size: 12px;
    color: #a1a1aa;
    letter-spacing: 0.025em;
}

.cpk-a2ui-tokens {
    font-size: 11px;
    color: #d4d4d8;
    font-variant-numeric: tabular-nums;
}

@keyframes cpk-a2ui-fade {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

@keyframes cpk-a2ui-sweep {
    0% {
        background-position: 250% 0;
    }

    100% {
        background-position: -250% 0;
    }
}
</style>