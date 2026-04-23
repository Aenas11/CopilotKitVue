import { shallowRef, watch, onUnmounted, type MaybeRef } from "vue";
import type { AbstractAgent } from "@ag-ui/client";
import { useAgent } from "./useAgent";
import { useCopilotKit } from "./useCopilotKit";

export interface UseHumanInTheLoopOptions {
  /** ID of the interrupt to handle. */
  interruptId?: string;
  /** Agent ID scope. */
  agentId?: string | MaybeRef<string>;
  /** Thread ID scope. */
  threadId?: string | MaybeRef<string | undefined>;
}

export interface UseHumanInTheLoopReturn {
  /** Whether the interrupt is pending a response. */
  isPending: ReturnType<typeof shallowRef<boolean>>;
  /** The interrupt payload sent by the agent (e.g. a question or prompt object). */
  interruptValue: ReturnType<typeof shallowRef<unknown>>;
  /** Resolve the interrupt with a value. Sets agent state and resumes the run. */
  resolve(value: unknown): void;
  /** Reject / cancel the interrupt. Stops the current agent run. */
  reject(reason?: string): void;
}

/**
 * Handles human-in-the-loop interrupts from the agent.
 *
 * Subscribes to the active agent and surfaces `LangGraphInterruptEvent` custom
 * events as reactive `isPending` / `interruptValue` state. Call `resolve(answer)`
 * to resume the paused run or `reject()` to stop it.
 *
 * Mirrors the React `useHumanInTheLoop` hook.
 */
export function useHumanInTheLoop(
  options: UseHumanInTheLoopOptions = {},
): UseHumanInTheLoopReturn {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({
    agentId: options.agentId,
    threadId: options.threadId as MaybeRef<string | undefined>,
  });

  const isPending = shallowRef(false);
  const interruptValue = shallowRef<unknown>(undefined);
  let unsubscribeFn: (() => void) | null = null;

  function clearInterrupt() {
    isPending.value = false;
    interruptValue.value = undefined;
  }

  function stopSub() {
    if (unsubscribeFn) {
      unsubscribeFn();
      unsubscribeFn = null;
    }
  }

  watch(
    agent,
    (resolvedAgent) => {
      stopSub();
      if (!resolvedAgent) return;

      const { unsubscribe } = (resolvedAgent as AbstractAgent).subscribe({
        onCustomEvent({ event }) {
          if (event.name === "LangGraphInterruptEvent") {
            isPending.value = true;
            interruptValue.value = event.value;
          }
        },
      });
      unsubscribeFn = unsubscribe;
    },
    { immediate: true },
  );

  onUnmounted(() => {
    stopSub();
    clearInterrupt();
  });

  function resolve(value: unknown) {
    const resolvedAgent = agent.value as AbstractAgent | null;
    if (!resolvedAgent || !isPending.value) return;

    const existingState = (resolvedAgent.state ?? {}) as Record<string, unknown>;
    resolvedAgent.setState({
      ...existingState,
      __copilotkit_interrupt_response: value,
    });

    clearInterrupt();

    copilotkit.runAgent({
      agent: resolvedAgent,
      forwardedProps: { ...(copilotkit.properties ?? {}) },
    });
  }

  function reject(_reason?: string) {
    const resolvedAgent = agent.value as AbstractAgent | null;
    if (resolvedAgent) {
      copilotkit.stopAgent({ agent: resolvedAgent });
    }
    clearInterrupt();
  }

  return { isPending, interruptValue, resolve, reject };
}
