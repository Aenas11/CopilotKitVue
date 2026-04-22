import { onUnmounted, watch, toValue, type MaybeRefOrGetter } from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseAgentContextInput {
  /** Human-readable description passed to the LLM as context. */
  description: string;
  /** The value to make readable. Can be any serialisable value. */
  value: MaybeRefOrGetter<unknown>;
}

/**
 * Registers a reactive value as LLM-readable context.
 * Mirrors the React `useAgentContext` hook.
 */
export function useAgentContext(input: UseAgentContextInput): void {
  const { copilotkit } = useCopilotKit();

  let currentId: string | undefined;

  watch(
    () => toValue(input.value),
    (resolved) => {
      if (currentId) {
        copilotkit.removeContext?.(currentId);
      }

      currentId = copilotkit.addContext?.({
        description: input.description,
        value: typeof resolved === "string" ? resolved : JSON.stringify(resolved),
      });
    },
    { immediate: true, deep: true },
  );

  onUnmounted(() => {
    if (currentId) {
      copilotkit.removeContext?.(currentId);
    }
  });
}
