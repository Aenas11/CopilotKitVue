import { inject } from "vue";
import { CopilotKitKey, type CopilotKitContext } from "../providers/keys";

/**
 * Returns the `CopilotKitContext` injected by the nearest
 * `CopilotKitProvider` ancestor.
 *
 * Throws if called outside a provider tree.
 */
export function useCopilotKit(): CopilotKitContext {
  const ctx = inject(CopilotKitKey);
  if (!ctx) {
    throw new Error(
      "[CopilotKit] useCopilotKit() must be called inside a <CopilotKitProvider>.",
    );
  }
  return ctx;
}
