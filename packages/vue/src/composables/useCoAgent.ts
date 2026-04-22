import { useAgent } from "./useAgent";
import type { UseAgentOptions, UseAgentReturn } from "./useAgent";

/**
 * Legacy v1 alias for `useAgent`.
 *
 * Maps the old `useCoAgent({ name, ... })` API to `useAgent({ agentId: name, ... })`.
 * Mirrors the React `useCoAgent` hook (which internally delegates to `useAgent`).
 */
export interface UseCoAgentOptions extends Omit<UseAgentOptions, "agentId"> {
  name: string;
}

export function useCoAgent(options: UseCoAgentOptions): UseAgentReturn {
  return useAgent({ ...options, agentId: options.name });
}
