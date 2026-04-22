import { ref, onUnmounted } from "vue";
import { useCopilotKit } from "./useCopilotKit";

export interface UseThreadsOptions {
  agentId: string;
  includeArchived?: boolean;
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
  threads: ReturnType<typeof ref<Thread[]>>;
  isLoading: ReturnType<typeof ref<boolean>>;
  error: ReturnType<typeof ref<Error | null>>;
  hasNextPage: ReturnType<typeof ref<boolean>>;
  isFetchingNextPage: ReturnType<typeof ref<boolean>>;
  fetchNextPage(): Promise<void>;
  createThread(name?: string): Promise<Thread>;
  deleteThread(id: string): Promise<void>;
  archiveThread(id: string): Promise<void>;
  renameThread(id: string, name: string): Promise<void>;
}

/**
 * Manages conversation threads on the Intelligence platform.
 * Mirrors the React `useThreads` hook.
 *
 * @todo Implement using `ɵcreateThreadStore` from `@copilotkit/core` once
 *       the Vue package has full core version alignment.
 */
export function useThreads(_options: UseThreadsOptions): UseThreadsReturn {
  const threads = ref<Thread[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const hasNextPage = ref(false);
  const isFetchingNextPage = ref(false);

  async function fetchNextPage() {
    // TODO: implement via ɵcreateThreadStore
  }
  async function createThread(_name?: string): Promise<Thread> {
    throw new Error("useThreads: not yet implemented");
  }
  async function deleteThread(_id: string) { }
  async function archiveThread(_id: string) { }
  async function renameThread(_id: string, _name: string) { }

  return {
    threads,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    createThread,
    deleteThread,
    archiveThread,
    renameThread,
  };
}
