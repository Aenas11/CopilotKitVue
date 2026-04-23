import { describe, expect, it } from "vitest";
import type { CopilotKitCore } from "@copilotkit/core";
import {
    getToolCallRenderer,
    removeToolCallRenderer,
    upsertToolCallRenderer,
} from "./toolCallRenderRegistry";

describe("toolCallRenderRegistry", () => {
    it("resolves renderer in expected precedence order", () => {
        const core = {} as CopilotKitCore;
        const globalName = () => "global-name";
        const agentWildcard = () => "agent-wildcard";
        const globalWildcard = () => "global-wildcard";

        upsertToolCallRenderer(core, { name: "release", render: globalName });
        upsertToolCallRenderer(core, { name: "*", agentId: "agent-a", render: agentWildcard });
        upsertToolCallRenderer(core, { name: "*", render: globalWildcard });

        const exactGlobal = getToolCallRenderer(core, { name: "release", agentId: "agent-a" });
        expect(exactGlobal?.render).toBe(globalName);

        const agentFallback = getToolCallRenderer(core, { name: "missing", agentId: "agent-a" });
        expect(agentFallback?.render).toBe(agentWildcard);

        const globalFallback = getToolCallRenderer(core, { name: "missing", agentId: "agent-b" });
        expect(globalFallback?.render).toBe(globalWildcard);
    });

    it("removes scoped entries without affecting other registrations", () => {
        const core = {} as CopilotKitCore;
        const agentSpecific = () => "agent-specific";
        const globalName = () => "global-name";

        upsertToolCallRenderer(core, { name: "tool-x", agentId: "agent-a", render: agentSpecific });
        upsertToolCallRenderer(core, { name: "tool-x", render: globalName });

        removeToolCallRenderer(core, "tool-x", "agent-a");

        const afterRemoval = getToolCallRenderer(core, { name: "tool-x", agentId: "agent-a" });
        expect(afterRemoval?.render).toBe(globalName);
    });
});
