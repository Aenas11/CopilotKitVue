import { onUnmounted, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useCopilotKit } from "./useCopilotKit";
import {
  removeToolCallRenderer,
  upsertToolCallRenderer,
  type ToolCallRenderFn,
} from "../adapters/toolCallRenderRegistry";

export interface UseRenderToolOptions {
  /** Tool name to intercept for rendering. */
  name: string;
  /** Render function called with parsed args/result and status. */
  render: ToolCallRenderFn;
  /** Optional agent ID scope. */
  agentId?: string;
}

/**
 * Registers a Vue component as the renderer for a given tool call.
 * Mirrors the React `useRenderTool` hook.
 *
 */
export function useRenderTool(
  options: MaybeRefOrGetter<UseRenderToolOptions>,
  deps?: MaybeRefOrGetter<unknown>[],
): void {
  const { copilotkit } = useCopilotKit();
  const extraDeps = deps ?? [];

  watch(
    [() => toValue(options), ...extraDeps.map((d) => () => toValue(d))],
    ([resolved], [previous]) => {
      const prev = previous as UseRenderToolOptions | undefined;
      const next = resolved as UseRenderToolOptions;

      if (prev) {
        removeToolCallRenderer(copilotkit, prev.name, prev.agentId);
      }

      upsertToolCallRenderer(copilotkit, {
        name: next.name,
        agentId: next.agentId,
        render: next.render,
      });
    },
    { immediate: true },
  );

  onUnmounted(() => {
    const resolved = toValue(options);
    removeToolCallRenderer(copilotkit, resolved.name, resolved.agentId);
  });
}

/**
 * Mirrors the React `useRenderToolCall` hook (v1 alias).
 */
export const useRenderToolCall = useRenderTool;

/**
 * Mirrors the React `useDefaultRenderTool` hook.
 * Registers the fallback renderer for unhandled tool calls.
 *
 */
export function useDefaultRenderTool(
  render: ToolCallRenderFn,
  agentId?: string,
): void {
  useRenderTool({ name: "*", render, agentId });
}
