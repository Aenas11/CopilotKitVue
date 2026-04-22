import { onUnmounted, shallowRef, triggerRef, watch, toValue, type MaybeRef } from "vue";
import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
import {
  CopilotKitCoreRuntimeConnectionStatus,
  ProxiedCopilotRuntimeAgent,
} from "@copilotkit/core";
import type { AbstractAgent, Message, State } from "@ag-ui/client";
import { useCopilotKit } from "./useCopilotKit";
import { useCopilotChatConfiguration } from "./useCopilotChatConfiguration";

export { UseAgentUpdate } from "./useAgentTypes";

export interface UseAgentOptions {
  /** Agent ID to subscribe to. Defaults to `DEFAULT_AGENT_ID`. */
  agentId?: string | MaybeRef<string>;
  /**
   * Thread ID to scope the agent subscription. Falls back to the nearest
   * `CopilotChatConfigurationProvider` threadId, then the provider threadId.
   */
  threadId?: string | MaybeRef<string | undefined>;
  /**
   * Throttle interval (ms) for message refresh.
   */
  throttleMs?: number | MaybeRef<number | undefined>;
}

export interface UseAgentReturn {
  /** The resolved `AbstractAgent` instance, or `null` before resolution. */
  agent: Readonly<ReturnType<typeof shallowRef<AbstractAgent | null>>>;
  /** Reactive array of conversation messages. */
  messages: Readonly<ReturnType<typeof shallowRef<Message[]>>>;
  /** Reactive agent state object. */
  state: Readonly<ReturnType<typeof shallowRef<State | null>>>;
  /** `true` while an agent run is active. */
  isRunning: Readonly<ReturnType<typeof shallowRef<boolean>>>;
}

/**
 * Subscribes to an agent managed by the nearest `CopilotKitProvider` and
 * exposes reactive `messages`, `state`, and `isRunning` refs.
 *
 * Mirrors the React `useAgent` hook 1:1.
 */
export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const { copilotkit, threadId: providerThreadId } = useCopilotKit();
  const chatConfig = useCopilotChatConfiguration();

  const agent = shallowRef<AbstractAgent | null>(null);
  const messages = shallowRef<Message[]>([]);
  const state = shallowRef<State | null>(null);
  const isRunning = shallowRef(false);
  const threadAgentCache = new Map<string, AbstractAgent>();
  const provisionalAgentCache = new Map<string, ProxiedCopilotRuntimeAgent>();
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  let runSub: { unsubscribe: () => void } | null = null;

  function stopPolling() {
    if (pollingInterval != null) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function stopRunSubscription() {
    if (runSub) {
      runSub.unsubscribe();
      runSub = null;
    }
  }

  function finalizeRun(id: string) {
    const currentAgent = copilotkit.getAgent(id);
    if (currentAgent) {
      messages.value = [...(currentAgent.messages ?? [])];
      state.value = currentAgent.state ?? null;
      triggerRef(messages);
      triggerRef(state);
    }
    isRunning.value = false;
    triggerRef(isRunning);
    stopPolling();
    stopRunSubscription();
  }

  function resolveAgentId() {
    return toValue(options.agentId) ?? DEFAULT_AGENT_ID;
  }

  function resolveThreadId() {
    return toValue(options.threadId) ?? chatConfig?.threadId ?? providerThreadId;
  }

  function getAgentCacheKey(id: string) {
    const thread = resolveThreadId();
    return thread ? `${id}:${thread}` : id;
  }

  function cloneAgentForThread(existing: AbstractAgent) {
    const threadId = resolveThreadId();
    if (!threadId) return existing;

    const cacheKey = getAgentCacheKey(existing.agentId ?? resolveAgentId());
    const cached = threadAgentCache.get(cacheKey);
    if (cached) return cached;

    const clone = existing.clone?.() ?? existing;
    clone.threadId = threadId;
    if (clone instanceof ProxiedCopilotRuntimeAgent) {
      clone.headers = { ...copilotkit.headers };
    }
    threadAgentCache.set(cacheKey, clone);
    return clone;
  }

  function syncFromAgent(a: AbstractAgent | null) {
    if (!a) {
      messages.value = [];
      state.value = null;
      return;
    }
    messages.value = [...(a.messages ?? [])];
    state.value = a.state ?? null;
    triggerRef(messages);
    triggerRef(state);
  }

  function resolveAgent() {
    const id = resolveAgentId();
    const existing = copilotkit.getAgent(id);
    if (existing) {
      provisionalAgentCache.delete(getAgentCacheKey(id));
      return cloneAgentForThread(existing);
    }

    const isRuntimeConfigured = copilotkit.runtimeUrl !== undefined;
    const status = copilotkit.runtimeConnectionStatus;

    if (
      isRuntimeConfigured &&
      (status === CopilotKitCoreRuntimeConnectionStatus.Disconnected ||
        status === CopilotKitCoreRuntimeConnectionStatus.Connecting ||
        status === CopilotKitCoreRuntimeConnectionStatus.Error)
    ) {
      const cacheKey = getAgentCacheKey(id);
      const cached = provisionalAgentCache.get(cacheKey);
      if (cached) {
        cached.headers = { ...copilotkit.headers };
        const threadId = resolveThreadId();
        if (threadId) cached.threadId = threadId;
        return cached;
      }

      const provisional = new ProxiedCopilotRuntimeAgent({
        runtimeUrl: copilotkit.runtimeUrl,
        agentId: id,
        transport: copilotkit.runtimeTransport,
        runtimeMode: "pending",
      });
      provisional.headers = { ...copilotkit.headers };
      const threadId = resolveThreadId();
      if (threadId) {
        provisional.threadId = threadId;
      }
      provisionalAgentCache.set(cacheKey, provisional);
      return cloneAgentForThread(provisional);
    }

    return null;
  }

  function refresh() {
    const resolved = resolveAgent();
    agent.value = resolved;
    triggerRef(agent);
    syncFromAgent(resolved);
  }

  // Subscribe to CopilotKitCore events to know when agents change or runs start/end.
  const sub = copilotkit.subscribe({
    onAgentsChanged() {
      refresh();
    },
    onError(event) {
      const id = resolveAgentId();
      const eventAgentId = event.context?.agentId as string | undefined;
      if (isRunning.value && (!eventAgentId || eventAgentId === id)) {
        finalizeRun(id);
      }
    },
    onAgentRunStarted(event) {
      const id = resolveAgentId();
      if (event.agent.agentId === id || !event.agent.agentId) {
        stopPolling();
        stopRunSubscription();
        isRunning.value = true;
        agent.value = event.agent;
        triggerRef(isRunning);
        triggerRef(agent);
        // Poll messages during run using MutationObserver fallback
        const runAgent = event.agent;
        pollingInterval = setInterval(() => {
          if (!isRunning.value) { stopPolling(); return; }
          messages.value = [...(runAgent.messages ?? [])];
          state.value = runAgent.state ?? null;
          triggerRef(messages);
          triggerRef(state);
        }, 150);
        // Finalize on terminal run events instead of relying on onAgentsChanged.
        runSub = runAgent.subscribe({
          onRunFinishedEvent() {
            finalizeRun(id);
          },
          onRunErrorEvent() {
            finalizeRun(id);
          },
          onRunFailed() {
            finalizeRun(id);
          },
        });
      }
    },
  });

  onUnmounted(() => {
    stopPolling();
    stopRunSubscription();
    sub.unsubscribe();
  });

  // Initial population
  refresh();

  return { agent, messages, state, isRunning };
}
