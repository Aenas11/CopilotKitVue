import type { CopilotKitCore } from "@copilotkit/core";

export type ToolCallRenderStatus = "in-progress" | "executing" | "complete";

export interface ToolCallRenderInput<
    TArgs extends Record<string, unknown> = Record<string, unknown>,
> {
    name: string;
    args: TArgs;
    status: ToolCallRenderStatus;
    result?: unknown;
}

export type ToolCallRenderFn = (
    input: ToolCallRenderInput,
) => unknown;

export interface ToolCallRendererEntry {
    name: string;
    agentId?: string;
    render: ToolCallRenderFn;
}

const registries = new WeakMap<CopilotKitCore, Map<string, ToolCallRendererEntry>>();

function key(name: string, agentId?: string): string {
    return `${agentId ?? ""}:${name}`;
}

function getRegistry(core: CopilotKitCore): Map<string, ToolCallRendererEntry> {
    let registry = registries.get(core);
    if (!registry) {
        registry = new Map<string, ToolCallRendererEntry>();
        registries.set(core, registry);
    }
    return registry;
}

export function upsertToolCallRenderer(
    core: CopilotKitCore,
    entry: ToolCallRendererEntry,
): void {
    getRegistry(core).set(key(entry.name, entry.agentId), entry);
}

export function removeToolCallRenderer(
    core: CopilotKitCore,
    name: string,
    agentId?: string,
): void {
    getRegistry(core).delete(key(name, agentId));
}

export function getToolCallRenderer(
    core: CopilotKitCore,
    params: { name: string; agentId?: string },
): ToolCallRendererEntry | undefined {
    const registry = getRegistry(core);

    return (
        (params.agentId ? registry.get(key(params.name, params.agentId)) : undefined) ??
        registry.get(key(params.name)) ??
        (params.agentId ? registry.get(key("*", params.agentId)) : undefined) ??
        registry.get(key("*"))
    );
}
