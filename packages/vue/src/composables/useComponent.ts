import { onUnmounted } from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseComponentOptions {
  name: string;
  agentId?: string;
  component: unknown; // Vue Component
}

/**
 * Registers a named Vue component in the agent's component registry so that
 * Generative UI messages can reference it by name.
 * Mirrors the React `useComponent` hook.
 *
 * @todo Full implementation pending Phase B (A2UI / Generative UI).
 */
export function useComponent(_options: UseComponentOptions): void {
  // Phase B
}
