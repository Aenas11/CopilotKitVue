import { onUnmounted, watch, toValue, type MaybeRefOrGetter } from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseCopilotAdditionalInstructionsOptions {
  instructions: MaybeRefOrGetter<string>;
  agentId?: string;
}

/**
 * Appends dynamic system-prompt instructions for the active agent.
 * Mirrors the React `useCopilotAdditionalInstructions` hook.
 *
 * @todo Map to `copilotkit.addAdditionalInstructions` once available in core.
 */
export function useCopilotAdditionalInstructions(
  _options: UseCopilotAdditionalInstructionsOptions,
): void {
  // Phase A: implement when core exposes addAdditionalInstructions
}
