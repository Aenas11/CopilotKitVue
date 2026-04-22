import { shallowRef, triggerRef, onUnmounted } from "vue";
import type { Suggestion } from "@copilotkit/core";
import { useCopilotKit } from "./useCopilotKit";

export interface UseSuggestionsReturn {
  suggestions: ReturnType<typeof shallowRef<Suggestion[]>>;
  isLoading: ReturnType<typeof shallowRef<boolean>>;
}

/**
 * Returns reactive chat suggestions for a given agent.
 * Mirrors the React `useSuggestions` hook.
 */
export function useSuggestions(agentId?: string): UseSuggestionsReturn {
  const { copilotkit } = useCopilotKit();
  const suggestions = shallowRef<Suggestion[]>([]);
  const isLoading = shallowRef(false);

  const sub = copilotkit.subscribe({
    onSuggestionsChanged(event) {
      if (!agentId || event.agentId === agentId) {
        suggestions.value = event.suggestions;
        triggerRef(suggestions);
      }
    },
    onSuggestionsStartedLoading(event) {
      if (!agentId || event.agentId === agentId) {
        isLoading.value = true;
        triggerRef(isLoading);
      }
    },
    onSuggestionsFinishedLoading(event) {
      if (!agentId || event.agentId === agentId) {
        isLoading.value = false;
        triggerRef(isLoading);
      }
    },
  });

  onUnmounted(() => sub.unsubscribe());

  return { suggestions, isLoading };
}
