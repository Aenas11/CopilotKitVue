import { ref, onUnmounted } from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseRenderToolOptions {
  /** Tool name to intercept for rendering. */
  name: string;
  /** Optional agent ID scope. */
  agentId?: string;
}

/**
 * Registers a Vue component as the renderer for a given tool call.
 * Mirrors the React `useRenderTool` hook.
 *
 * @todo Full implementation pending Phase B. Currently registers a
 *       placeholder renderer entry.
 */
export function useRenderTool(_options: UseRenderToolOptions): void {
  // Phase B: implement via copilotkit.addHookRenderToolCall
}

/**
 * Mirrors the React `useRenderToolCall` hook (v1 alias).
 */
export const useRenderToolCall = useRenderTool;

/**
 * Mirrors the React `useDefaultRenderTool` hook.
 * Registers the fallback renderer for unhandled tool calls.
 *
 * @todo Full implementation pending Phase B.
 */
export function useDefaultRenderTool(): void {
  // Phase B
}
