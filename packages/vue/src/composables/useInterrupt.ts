import { onUnmounted, shallowRef, watch, type MaybeRef } from "vue";
import { parseJson } from "@copilotkit/shared";
import type { AbstractAgent } from "@ag-ui/client";
import { useAgent } from "./useAgent";
import { useCopilotChatConfiguration } from "./useCopilotChatConfiguration";
import { useCopilotKit } from "./useCopilotKit";

const INTERRUPT_EVENT_NAME = "on_interrupt";
const LANGGRAPH_INTERRUPT_EVENT_NAME = "LangGraphInterruptEvent";

export interface InterruptEvent<TValue = unknown> {
  name: string;
  value: TValue;
}

export interface InterruptHandlerProps<TValue = unknown> {
  event: InterruptEvent<TValue>;
  resolve: (response: unknown) => void;
}

export interface UseInterruptConfig<TValue = unknown, TResult = unknown> {
  agentId?: string | MaybeRef<string>;
  enabled?: (event: InterruptEvent<TValue>) => boolean;
  handler?: (props: InterruptHandlerProps<TValue>) => TResult | PromiseLike<TResult>;
}

export interface UseInterruptReturn<TValue = unknown, TResult = unknown> {
  isPending: Readonly<ReturnType<typeof shallowRef<boolean>>>;
  event: Readonly<ReturnType<typeof shallowRef<InterruptEvent<TValue> | null>>>;
  result: Readonly<ReturnType<typeof shallowRef<TResult | null>>>;
  resolve(value: unknown): void;
  reject(reason?: string): void;
}

function isPromiseLike<TValue>(
  value: TValue | PromiseLike<TValue>,
): value is PromiseLike<TValue> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof Reflect.get(value, "then") === "function"
  );
}

/**
 * v2 interrupt hook. Mirrors the React `useInterrupt` hook with a Vue-native
 * return shape: reactive interrupt state plus `resolve` / `reject` actions.
 */
export function useInterrupt<TValue = unknown, TResult = unknown>(
  config: UseInterruptConfig<TValue, TResult> = {},
): UseInterruptReturn<TValue, TResult> {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: config.agentId });

  const isPending = shallowRef(false);
  const event = shallowRef<InterruptEvent<TValue> | null>(null);
  const result = shallowRef<TResult | null>(null);

  let unsubscribeFn: (() => void) | null = null;
  let handlerToken = 0;

  function clearInterrupt() {
    isPending.value = false;
    event.value = null;
    result.value = null;
    handlerToken += 1;
  }

  function stopSub() {
    if (unsubscribeFn) {
      unsubscribeFn();
      unsubscribeFn = null;
    }
  }

  function resolve(response: unknown) {
    const resolvedAgent = agent.value as AbstractAgent | null;
    if (!resolvedAgent || !event.value) {
      return;
    }

    const interruptEvent = event.value.value;
    clearInterrupt();

    copilotkit.runAgent({
      agent: resolvedAgent,
      forwardedProps: {
        ...(copilotkit.properties ?? {}),
        command: {
          interruptEvent,
          resume: response,
        },
      },
    });
  }

  function reject(_reason?: string) {
    const resolvedAgent = agent.value as AbstractAgent | null;
    clearInterrupt();

    if (resolvedAgent) {
      copilotkit.stopAgent({ agent: resolvedAgent });
    }
  }

  function handlePendingInterrupt(nextEvent: InterruptEvent<TValue>) {
    if (config.enabled && !config.enabled(nextEvent)) {
      clearInterrupt();
      return;
    }

    isPending.value = true;
    event.value = nextEvent;
    result.value = null;

    if (!config.handler) {
      return;
    }

    const currentToken = ++handlerToken;
    const maybePromise = config.handler({
      event: nextEvent,
      resolve,
    });

    if (isPromiseLike(maybePromise)) {
      Promise.resolve(maybePromise)
        .then((resolved) => {
          if (currentToken === handlerToken && event.value === nextEvent) {
            result.value = resolved;
          }
        })
        .catch(() => {
          if (currentToken === handlerToken && event.value === nextEvent) {
            result.value = null;
          }
        });
      return;
    }

    if (currentToken === handlerToken && event.value === nextEvent) {
      result.value = maybePromise;
    }
  }

  watch(
    agent,
    (resolvedAgent) => {
      stopSub();
      clearInterrupt();

      if (!resolvedAgent) {
        return;
      }

      let localInterrupt: InterruptEvent<TValue> | null = null;

      const { unsubscribe } = (resolvedAgent as AbstractAgent).subscribe({
        onCustomEvent: ({ event: customEvent }) => {
          if (
            customEvent.name === INTERRUPT_EVENT_NAME ||
            customEvent.name === LANGGRAPH_INTERRUPT_EVENT_NAME
          ) {
            localInterrupt = {
              name: customEvent.name,
              value: customEvent.value as TValue,
            };
          }
        },
        onRunStartedEvent: () => {
          localInterrupt = null;
          clearInterrupt();
        },
        onRunFinalized: () => {
          if (!localInterrupt) {
            return;
          }

          const finalizedInterrupt = localInterrupt;
          localInterrupt = null;
          handlePendingInterrupt(finalizedInterrupt);
        },
        onRunFailed: () => {
          localInterrupt = null;
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

  return { isPending, event, result, resolve, reject };
}

/**
 * LangGraph-specific interrupt handler.
 * Mirrors the React `useLangGraphInterrupt` hook but returns Vue refs instead
 * of a rendered element.
 */
export function useLangGraphInterrupt<TValue = unknown, TResult = unknown>(
  config: UseInterruptConfig<TValue, TResult> = {},
): UseInterruptReturn<TValue, TResult> {
  const chatConfig = useCopilotChatConfiguration();
  const normalizedEvent = shallowRef<InterruptEvent<TValue> | null>(null);
  const base = useInterrupt<unknown, TResult>({
    agentId: config.agentId ?? chatConfig.agentId,
    enabled: config.enabled
      ? (event) =>
        config.enabled!(
          toLangGraphInterruptEvent<TValue>(event),
        )
      : undefined,
    handler: config.handler
      ? ({ event, resolve }) =>
        config.handler!({
          event: toLangGraphInterruptEvent<TValue>(event),
          resolve,
        })
      : undefined,
  });

  watch(
    base.event,
    (nextEvent) => {
      normalizedEvent.value = nextEvent
        ? toLangGraphInterruptEvent<TValue>(nextEvent)
        : null;
    },
    { immediate: true, flush: "sync" },
  );

  return {
    isPending: base.isPending,
    event: normalizedEvent,
    result: base.result,
    resolve: base.resolve,
    reject: base.reject,
  };
}

function toLangGraphInterruptEvent<TValue>(
  event: InterruptEvent<unknown>,
): InterruptEvent<TValue> {
  return {
    name: LANGGRAPH_INTERRUPT_EVENT_NAME,
    value:
      typeof event.value === "string"
        ? (parseJson(event.value, event.value) as TValue)
        : (event.value as TValue),
  };
}
