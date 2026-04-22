import { ref } from "vue";

export interface UseHumanInTheLoopOptions {
  /** ID of the interrupt to handle. */
  interruptId?: string;
  /** Agent ID scope. */
  agentId?: string;
}

export interface UseHumanInTheLoopReturn {
  /** Whether the interrupt is pending a response. */
  isPending: ReturnType<typeof ref<boolean>>;
  /** Resolve the interrupt with a value. */
  resolve(value: unknown): void;
  /** Reject / cancel the interrupt. */
  reject(reason?: string): void;
}

/**
 * Handles human-in-the-loop interrupts from the agent.
 * Mirrors the React `useHumanInTheLoop` hook.
 *
 * @todo Full implementation pending Phase B.
 */
export function useHumanInTheLoop(
  _options: UseHumanInTheLoopOptions = {},
): UseHumanInTheLoopReturn {
  const isPending = ref(false);
  return {
    isPending,
    resolve(_value: unknown) { },
    reject(_reason?: string) { },
  };
}
