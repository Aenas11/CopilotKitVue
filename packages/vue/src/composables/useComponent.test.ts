import { defineComponent, inject } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { CopilotKitCore } from "@copilotkit/core";
import CopilotKitProvider from "../providers/CopilotKitProvider.vue";
import { getToolCallRenderer } from "../adapters/toolCallRenderRegistry";
import { useComponent } from "./useComponent";
import { CopilotKitKey } from "../providers/keys";

// ── Helpers ─────────────────────────────────────────────────────────────────

function mountProbe(options: Parameters<typeof useComponent>[0]) {
    let capturedCore: CopilotKitCore | null = null;

    const Probe = defineComponent({
        name: "Probe",
        setup() {
            const ctx = inject(CopilotKitKey);
            capturedCore = (ctx?.copilotkit ?? null) as CopilotKitCore | null;
            useComponent(options);
            return () => null;
        },
    });

    const wrapper = mount(CopilotKitProvider, {
        props: { runtimeUrl: "/api/copilotkit" },
        slots: { default: Probe },
    });

    return { wrapper, getCapturedCore: () => capturedCore };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useComponent", () => {
    it("registers a frontend tool with the default description", () => {
        const MockCard = defineComponent({ name: "MockCard", template: "<div/>" });
        const { getCapturedCore } = mountProbe({
            name: "showWeather",
            component: MockCard,
            agentId: "agent-1",
        });

        const core = getCapturedCore();
        expect(core).toBeTruthy();

        const tool = core!.getTool({ toolName: "showWeather", agentId: "agent-1" });
        expect(tool).toBeDefined();
        expect(tool!.name).toBe("showWeather");
        expect(tool!.description).toContain("showWeather");
        expect(tool!.description).toContain("visual UI component");
    });

    it("appends the user description to the default prefix", () => {
        const MockCard = defineComponent({ name: "MockCard2", template: "<div/>" });
        const { getCapturedCore } = mountProbe({
            name: "showProfile",
            description: "Displays a user profile card.",
            component: MockCard,
        });

        const core = getCapturedCore();
        const tool = core!.getTool({ toolName: "showProfile" });
        expect(tool!.description).toContain("Displays a user profile card.");
    });

    it("registers a render function in the tool-call render registry", () => {
        const MockCard = defineComponent({ name: "MockCard3", template: "<div/>" });
        const { getCapturedCore } = mountProbe({
            name: "showBadge",
            component: MockCard,
            agentId: "agent-2",
        });

        const core = getCapturedCore();
        const renderer = getToolCallRenderer(core!, { name: "showBadge", agentId: "agent-2" });
        expect(renderer).toBeDefined();
        expect(typeof renderer!.render).toBe("function");
    });

    it("unregisters both the tool and renderer on unmount", () => {
        const MockCard = defineComponent({ name: "MockCard4", template: "<div/>" });
        const { wrapper, getCapturedCore } = mountProbe({
            name: "showCard",
            component: MockCard,
            agentId: "agent-3",
        });

        const core = getCapturedCore();
        expect(core!.getTool({ toolName: "showCard", agentId: "agent-3" })).toBeDefined();
        expect(getToolCallRenderer(core!, { name: "showCard", agentId: "agent-3" })).toBeDefined();

        wrapper.unmount();

        expect(core!.getTool({ toolName: "showCard", agentId: "agent-3" })).toBeUndefined();
        expect(getToolCallRenderer(core!, { name: "showCard", agentId: "agent-3" })).toBeUndefined();
    });
});
