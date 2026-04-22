import { ref } from "vue";

export interface UseInterruptConfig {
  agentId?: string;
}

export interface UseInterruptReturn {
  isPending: ReturnType<typeof ref<boolean>>;
  resolve(value: unknown): void;
  reject(reason?: string): void;
}

/**
 * v2 interrupt hook. Mirrors the React `useInterrupt` hook.
 *
 * @todo Full implementation pending Phase B.
 */
export function useInterrupt(_config: UseInterruptConfig = {}): UseInterruptReturn {
  const isPending = ref(false);
  return {
    isPending,
    resolve(_value: unknown) { },
    reject(_reason?: string) { },
  };
}

/**
 * LangGraph-specific interrupt handler.
 * Mirrors the React `useLangGraphInterrupt` hook.
 *
 * @todo Full implementation pending Phase B.
 */
export function useLangGraphInterrupt(_config: UseInterruptConfig = {}): UseInterruptReturn {
  return useInterrupt(_config);
}
