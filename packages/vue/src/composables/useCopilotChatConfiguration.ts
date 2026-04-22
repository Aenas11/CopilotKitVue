import { inject } from "vue";
import { CopilotChatConfigurationKey } from "../providers/keys";
import type { CopilotChatConfiguration } from "../providers/keys";

/**
 * Returns the nearest `CopilotChatConfiguration` injected by
 * `CopilotChatConfigurationProvider` (or `CopilotChat` / `CopilotSidebar`).
 *
 * Returns an empty object when called outside a chat configuration provider.
 */
export function useCopilotChatConfiguration(): CopilotChatConfiguration {
  return inject(CopilotChatConfigurationKey, {});
}
