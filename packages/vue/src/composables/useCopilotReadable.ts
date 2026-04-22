import {
  onUnmounted,
  watch,
  toValue,
  type MaybeRefOrGetter,
} from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseCopilotReadableOptions {
  /** Human-readable description passed to the LLM as context. */
  description: string;
  /** The value to make readable. Can be any serialisable value. */
  value: MaybeRefOrGetter<unknown>;
  /** Optional categories to group the context entry. */
  categories?: string[];
  /** ID of the agent this context is scoped to. Defaults to global. */
  agentId?: string;
}

/**
 * Registers a reactive value as LLM-readable context. Updates the context
 * entry whenever `value` changes, and removes it on unmount.
 *
 * Mirrors the React `useCopilotReadable` hook.
 */
export function useCopilotReadable(options: UseCopilotReadableOptions): void {
  const { copilotkit } = useCopilotKit();

  let currentId: string | undefined;

  watch(
    () => toValue(options.value),
    (resolved) => {
      if (currentId) {
        copilotkit.removeContext?.(currentId);
      }
      currentId = copilotkit.addContext?.({
        description: options.description,
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
