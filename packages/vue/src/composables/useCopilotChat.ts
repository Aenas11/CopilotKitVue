import { ref, shallowRef, triggerRef, watch } from "vue";
import type { Message } from "@ag-ui/client";
import { useCopilotKit } from "./useCopilotKit";
import { useAgent, type UseAgentOptions } from "./useAgent";

export interface UseCopilotChatOptions extends UseAgentOptions {
  /** Initial messages to pre-populate the chat. */
  initialMessages?: Message[];
}

export interface UseCopilotChatReturn {
  /** Reactive array of conversation messages. */
  messages: ReturnType<typeof shallowRef<Message[]>>;
  /** Send a new user message. Returns when the run completes. */
  sendMessage(text: string): Promise<void>;
  /** Stop the current run (if active). */
  stop(): void;
  /** Reload (re-run) the last user message. */
  reload(): Promise<void>;
  /** `true` while the agent is running. */
  isLoading: ReturnType<typeof shallowRef<boolean>>;
  /** Last error, if any. */
  error: ReturnType<typeof ref<Error | null>>;
}

/**
 * High-level chat composable. Wraps `useAgent` and adds `sendMessage`,
 * `stop`, and `reload` conveniences.
 *
 * Mirrors the React `useCopilotChat` hook.
 */
export function useCopilotChat(
  options: UseCopilotChatOptions = {},
): UseCopilotChatReturn {
  const { copilotkit } = useCopilotKit();
  const { agent, messages, isRunning } = useAgent(options);
  const error = ref<Error | null>(null);

  async function runAgent(resolvedAgent: NonNullable<typeof agent.value>): Promise<void> {
    const subscriber = {
      onRunInitialized() {
        (isRunning as { value: boolean }).value = true;
        triggerRef(isRunning);
      },
      onMessagesChanged() {
        (messages as { value: Message[] }).value = [...(resolvedAgent.messages ?? [])];
        triggerRef(messages);
      },
      onStateChanged() {
        (messages as { value: Message[] }).value = [...(resolvedAgent.messages ?? [])];
        triggerRef(messages);
      },
      onRunFinalized() {
        (isRunning as { value: boolean }).value = false;
        triggerRef(isRunning);
        (messages as { value: Message[] }).value = [...(resolvedAgent.messages ?? [])];
        triggerRef(messages);
      },
      onRunFailed({ error: runError }: { error: Error }) {
        (isRunning as { value: boolean }).value = false;
        triggerRef(isRunning);
        error.value = runError;
      },
      onRunErrorEvent() {
        (isRunning as { value: boolean }).value = false;
        triggerRef(isRunning);
      },
    };

    const subscription = resolvedAgent.subscribe(subscriber as never);
    try {
      await copilotkit.runAgent({
        agent: resolvedAgent,
        forwardedProps: { ...(copilotkit.properties ?? {}) },
      });
      (messages as { value: Message[] }).value = [...(resolvedAgent.messages ?? [])];
      triggerRef(messages);
    } finally {
      subscription.unsubscribe();
      (isRunning as { value: boolean }).value = false;
      triggerRef(isRunning);
    }
  }

  async function sendMessage(text: string): Promise<void> {
    error.value = null;
    const resolved = agent.value;
    if (!resolved) {
      // Wait for the `agent` ref to resolve if it hasn't yet. This avoids a
      // noisy warning when callers attempt to send immediately after mount.
      await new Promise<void>((resolve) => {
        const stop = watch(agent, (v) => {
          if (v) {
            stop();
            resolve();
          }
        });
      });
    }
    const resolvedAgent = agent.value;
    if (!resolvedAgent) {
      console.warn("[CopilotKit] sendMessage called before agent resolved.");
      return;
    }
    try {
      // Append user message to the agent's message list, then run
      resolvedAgent.messages = [
        ...(resolvedAgent.messages ?? []),
        { role: "user", content: text, id: crypto.randomUUID?.() ?? `msg-${Date.now()}` } as Message,
      ];
      (messages as { value: Message[] }).value = [...(resolvedAgent.messages ?? [])];
      triggerRef(messages);
      await runAgent(resolvedAgent);
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    }
  }

  function stop(): void {
    const resolved = agent.value;
    if (!resolved) return;
    copilotkit.stopAgent({ agent: resolved });
  }

  async function reload(): Promise<void> {
    error.value = null;
    const resolved = agent.value;
    if (!resolved) {
      await new Promise<void>((resolve) => {
        const stop = watch(agent, (v) => {
          if (v) {
            stop();
            resolve();
          }
        });
      });
    }
    const resolvedAgent = agent.value;
    if (!resolvedAgent) return;
    try {
      await runAgent(resolvedAgent);
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    }
  }

  return {
    messages,
    sendMessage,
    stop,
    reload,
    isLoading: isRunning,
    error,
  };
}
