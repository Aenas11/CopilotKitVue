import { onUnmounted, watch, toValue, type MaybeRefOrGetter } from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseCopilotActionOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique name for this action. */
  name: string;
  /** Human-readable description for the LLM. */
  description?: string;
  /** JSON Schema parameters definition. */
  parameters?: Record<string, unknown>;
  /** Called when the action is invoked by the agent. */
  handler: (args: T) => unknown | Promise<unknown>;
  /** Agent ID to scope this action to. Defaults to global. */
  agentId?: string;
}

/**
 * Registers a named action that the agent can invoke. Unregisters on unmount.
 *
 * Mirrors the React `useCopilotAction` hook.
 */
export function useCopilotAction<
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: MaybeRefOrGetter<UseCopilotActionOptions<T>>): void {
  const { copilotkit } = useCopilotKit();

  watch(
    () => toValue(options),
    (resolved, prev) => {
      if (prev) copilotkit.removeTool?.(prev.name, prev.agentId);
      copilotkit.addTool?.({
        name: resolved.name,
        description: resolved.description,
        parameters: resolved.parameters as any,
        handler: resolved.handler as any,
        agentId: resolved.agentId,
      });
    },
    { immediate: true },
  );

  onUnmounted(() => {
    const resolved = toValue(options);
    copilotkit.removeTool?.(resolved.name, resolved.agentId);
  });
}
