import {
  computed,
  onMounted,
  onUnmounted,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import {
  CopilotKitCoreRuntimeConnectionStatus,
  ɵcreateThreadStore,
  ɵselectThreads,
  ɵselectThreadsError,
  ɵselectThreadsIsLoading,
  ɵselectHasNextPage,
  ɵselectIsFetchingNextPage,
  type ɵThread,
  type ɵThreadRuntimeContext,
} from "@copilotkit/core";
import { useCopilotKit } from "./useCopilotKit";

export interface UseThreadsOptions {
  /** The agent whose threads to list and manage. */
  agentId: string;
  /** When `true`, archived threads are included. Defaults to `false`. */
  includeArchived?: boolean;
  /** Maximum threads per page; enables cursor-based pagination when set. */
  limit?: number;
}

export interface Thread {
  id: string;
  agentId: string;
  name: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UseThreadsReturn {
  /** Live list of threads, sorted most-recently-updated first. */
  threads: Readonly<Ref<Thread[]>>;
  /** `true` while the initial thread list is being fetched. */
  isLoading: Readonly<Ref<boolean>>;
  /** Most recent fetch or mutation error, or `null` when none. */
  error: Readonly<Ref<Error | null>>;
  /** `true` when more threads are available via `fetchMoreThreads`. */
  hasMoreThreads: Readonly<Ref<boolean>>;
  /** `true` while a next-page fetch is in flight. */
  isFetchingMoreThreads: Readonly<Ref<boolean>>;
  /** Fetch the next page of threads. No-op when no more pages exist. */
  fetchMoreThreads(): void;
  /** Rename a thread on the platform. */
  renameThread(threadId: string, name: string): Promise<void>;
  /** Archive a thread on the platform. */
  archiveThread(threadId: string): Promise<void>;
  /** Permanently delete a thread from the platform. */
  deleteThread(threadId: string): Promise<void>;
}

/**
 * Lists and manages conversation threads on the Intelligence platform.
 * Mirrors the React `useThreads` hook.
 *
 * On mount the hook fetches threads for the authenticated user and the given
 * `agentId`. When the platform exposes a WebSocket URL it also opens a
 * realtime subscription so `threads` stays current without polling.
 */
export function useThreads(
  options: MaybeRefOrGetter<UseThreadsOptions>,
): UseThreadsReturn {
  const { copilotkit } = useCopilotKit();

  // Create the thread store once per composable call.
  const store = ɵcreateThreadStore({ fetch: globalThis.fetch });

  // --- Reactive state -------------------------------------------------------

  const threads = shallowRef<Thread[]>([]);
  const storeIsLoading = shallowRef(false);
  const storeError = shallowRef<Error | null>(null);
  const hasMoreThreads = shallowRef(false);
  const isFetchingMoreThreads = shallowRef(false);
  const hasDispatchedContext = shallowRef(false);
  const connectionStatus = shallowRef(copilotkit.runtimeConnectionStatus);

  // --- Subscribe to store state via RxJS observables -----------------------

  type Sub = { unsubscribe(): void };
  const subs: Sub[] = [];

  subs.push(
    store.select(ɵselectThreads).subscribe((raw: any) => {
      threads.value = (raw as ɵThread[]).map(
        ({ id, agentId, name, archived, createdAt, updatedAt }) => ({
          id,
          agentId,
          name,
          archived,
          createdAt,
          updatedAt,
        }),
      );
    }),
  );
  subs.push(
    store
      .select(ɵselectThreadsIsLoading)
      .subscribe((v: any) => (storeIsLoading.value = v as boolean)),
  );
  subs.push(
    store
      .select(ɵselectThreadsError)
      .subscribe((v: any) => (storeError.value = v as Error | null)),
  );
  subs.push(
    store
      .select(ɵselectHasNextPage)
      .subscribe((v: any) => (hasMoreThreads.value = v as boolean)),
  );
  subs.push(
    store
      .select(ɵselectIsFetchingNextPage)
      .subscribe((v: any) => (isFetchingMoreThreads.value = v as boolean)),
  );

  // --- Subscribe to CopilotKitCore for connection status changes -----------

  const coreSub = copilotkit.subscribe({
    onRuntimeConnectionStatusChanged: ({ status }) => {
      connectionStatus.value = status;
    },
  });

  // --- Lifecycle ------------------------------------------------------------

  onMounted(() => store.start());

  onUnmounted(() => {
    store.stop();
    subs.forEach((s) => s.unsubscribe());
    coreSub.unsubscribe();
  });

  // --- Set store context when runtime connects -----------------------------

  watch(
    [connectionStatus, () => toValue(options)],
    ([status, opts]) => {
      if (!copilotkit.runtimeUrl) {
        store.setContext(null);
        return;
      }

      // Wait until /info resolves so wsUrl is available in the initial context.
      if (status !== CopilotKitCoreRuntimeConnectionStatus.Connected) {
        return;
      }

      const context: ɵThreadRuntimeContext = {
        runtimeUrl: copilotkit.runtimeUrl,
        headers: { ...copilotkit.headers },
        wsUrl: copilotkit.intelligence?.wsUrl,
        agentId: opts.agentId,
        includeArchived: opts.includeArchived,
        limit: opts.limit,
      };
      store.setContext(context);
      hasDispatchedContext.value = true;
    },
    { immediate: true },
  );

  // --- Derived state --------------------------------------------------------

  const runtimeError = computed(() =>
    copilotkit.runtimeUrl ? null : new Error("Runtime URL is not configured"),
  );

  const isLoading = computed(() => {
    if (runtimeError.value) return false;
    // Synthesise loading=true until we've dispatched the first context so the
    // UI does not flash an empty list before the first fetch is in flight.
    const preConnectLoading =
      !!copilotkit.runtimeUrl && !hasDispatchedContext.value;
    return preConnectLoading || storeIsLoading.value;
  });

  const error = computed(() => runtimeError.value ?? storeError.value);

  // --- Mutations ------------------------------------------------------------

  return {
    threads,
    isLoading,
    error,
    hasMoreThreads,
    isFetchingMoreThreads,
    fetchMoreThreads: () => store.fetchNextPage(),
    renameThread: (threadId, name) => store.renameThread(threadId, name),
    archiveThread: (threadId) => store.archiveThread(threadId),
    deleteThread: (threadId) => store.deleteThread(threadId),
  };
}
