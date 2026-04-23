import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useThreads } from "./useThreads";
import type { UseThreadsReturn } from "./useThreads";
import CopilotKitProvider from "../providers/CopilotKitProvider.vue";

// ── Minimal observable helper ─────────────────────────────────────────────
// Avoids a direct rxjs import while still being subscribable.

type Observer<T> = (value: T) => void;

class SimpleSubject<T> {
    private _value: T;
    private _observers: Set<Observer<T>> = new Set();

    constructor(initial: T) {
        this._value = initial;
    }

    next(value: T): void {
        this._value = value;
        for (const fn of this._observers) fn(value);
    }

    subscribe(fn: Observer<T>): { unsubscribe(): void } {
        this._observers.add(fn);
        fn(this._value); // BehaviorSubject-like: emit current value immediately
        return { unsubscribe: () => this._observers.delete(fn) };
    }

    get value(): T {
        return this._value;
    }
}

// ── Thread store mock ─────────────────────────────────────────────────────

const mockStoreStart = vi.fn();
const mockStoreStop = vi.fn();
const mockStoreSetContext = vi.fn();
const mockStoreFetchNextPage = vi.fn();
const mockStoreRenameThread = vi.fn().mockResolvedValue(undefined);
const mockStoreArchiveThread = vi.fn().mockResolvedValue(undefined);
const mockStoreDeleteThread = vi.fn().mockResolvedValue(undefined);

const threads$ = new SimpleSubject<unknown[]>([]);
const isLoading$ = new SimpleSubject<boolean>(false);
const error$ = new SimpleSubject<Error | null>(null);
const hasNextPage$ = new SimpleSubject<boolean>(false);
const isFetchingNextPage$ = new SimpleSubject<boolean>(false);

const mockStore = {
    start: mockStoreStart,
    stop: mockStoreStop,
    setContext: mockStoreSetContext,
    fetchNextPage: mockStoreFetchNextPage,
    renameThread: mockStoreRenameThread,
    archiveThread: mockStoreArchiveThread,
    deleteThread: mockStoreDeleteThread,
    select: vi.fn((selector: (s: object) => unknown) => {
        // Identify selector by running it against sentinel state.
        const sentinelState = {
            threads: "__threads__",
            isLoading: "__isLoading__",
            error: "__error__",
            hasNextPage: "__hasNextPage__",
            isFetchingNextPage: "__isFetchingNextPage__",
        };
        const value = selector(sentinelState as any);
        if (value === "__threads__") return threads$;
        if (value === "__isLoading__") return isLoading$;
        if (value === "__error__") return error$;
        if (value === "__hasNextPage__") return hasNextPage$;
        if (value === "__isFetchingNextPage__") return isFetchingNextPage$;
        return new SimpleSubject(null);
    }),
    getState: vi.fn(() => ({})),
};

vi.mock("@copilotkit/core", async (importOriginal) => {
    const original = await importOriginal<typeof import("@copilotkit/core")>();
    return {
        ...original,
        ɵcreateThreadStore: vi.fn(() => mockStore),
        ɵselectThreads: (s: any) => s.threads,
        ɵselectThreadsIsLoading: (s: any) => s.isLoading,
        ɵselectThreadsError: (s: any) => s.error,
        ɵselectHasNextPage: (s: any) => s.hasNextPage,
        ɵselectIsFetchingNextPage: (s: any) => s.isFetchingNextPage,
    };
});

// ── Helpers ───────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
    threads$.next([]);
    isLoading$.next(false);
    error$.next(null);
    hasNextPage$.next(false);
    isFetchingNextPage$.next(false);
});

function mountProbe(agentId = "agent-x") {
    let result: UseThreadsReturn | undefined;

    const Probe = defineComponent({
        name: "Probe",
        setup() {
            result = useThreads({ agentId });
            return () => null;
        },
    });

    const wrapper = mount(CopilotKitProvider, {
        props: { runtimeUrl: "/api/copilotkit" },
        slots: { default: Probe },
    });

    return { wrapper, getResult: () => result! };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("useThreads", () => {
    it("returns correct reactive shape", () => {
        const { getResult } = mountProbe();
        const r = getResult();

        expect(r.threads).toBeDefined();
        expect(r.isLoading).toBeDefined();
        expect(r.error).toBeDefined();
        expect(r.hasMoreThreads).toBeDefined();
        expect(r.isFetchingMoreThreads).toBeDefined();
        expect(typeof r.fetchMoreThreads).toBe("function");
        expect(typeof r.renameThread).toBe("function");
        expect(typeof r.archiveThread).toBe("function");
        expect(typeof r.deleteThread).toBe("function");
    });

    it("starts the thread store on mount", () => {
        mountProbe();
        expect(mockStoreStart).toHaveBeenCalledOnce();
    });

    it("stops the thread store and unsubscribes on unmount", () => {
        const { wrapper } = mountProbe();
        wrapper.unmount();
        expect(mockStoreStop).toHaveBeenCalledOnce();
    });

    it("reflects threads pushed by the store", () => {
        const { getResult } = mountProbe();
        const r = getResult();

        expect(r.threads.value).toEqual([]);

        threads$.next([
            {
                id: "t1",
                agentId: "agent-x",
                name: "Thread 1",
                archived: false,
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-02T00:00:00Z",
            },
        ]);

        expect(r.threads.value).toHaveLength(1);
        expect(r.threads.value[0].id).toBe("t1");
    });

    it("reflects error pushed by the store", () => {
        const testError = new Error("fetch failed");
        const { getResult } = mountProbe();
        error$.next(testError);
        expect(getResult().error.value).toBe(testError);
    });

    it("delegates fetchMoreThreads to the store", () => {
        const { getResult } = mountProbe();
        getResult().fetchMoreThreads();
        expect(mockStoreFetchNextPage).toHaveBeenCalledOnce();
    });

    it("delegates renameThread to the store", async () => {
        const { getResult } = mountProbe();
        await getResult().renameThread("t1", "New Name");
        expect(mockStoreRenameThread).toHaveBeenCalledWith("t1", "New Name");
    });

    it("delegates archiveThread to the store", async () => {
        const { getResult } = mountProbe();
        await getResult().archiveThread("t1");
        expect(mockStoreArchiveThread).toHaveBeenCalledWith("t1");
    });

    it("delegates deleteThread to the store", async () => {
        const { getResult } = mountProbe();
        await getResult().deleteThread("t1");
        expect(mockStoreDeleteThread).toHaveBeenCalledWith("t1");
    });
});
