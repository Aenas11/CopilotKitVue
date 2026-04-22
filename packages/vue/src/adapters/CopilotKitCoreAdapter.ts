/**
 * CopilotKitCoreAdapter
 *
 * Bridges `CopilotKitCore` (framework-agnostic) to Vue reactivity.
 *
 * All direct subscriptions to `CopilotKitCore` lifecycle events are
 * centralised here. When upstream changes its subscription API, only
 * this file needs updating — composables reference the Vue-reactive
 * objects returned by this adapter.
 *
 * Usage: instantiated once by CopilotKitProvider and shared via
 * the CopilotKitKey injection. Composables call helper functions
 * from this module rather than accessing core directly.
 */

import { ref, shallowRef, triggerRef, type ShallowRef } from "vue";
import {
    CopilotKitCore,
    CopilotKitCoreRuntimeConnectionStatus,
    type CopilotKitCoreSubscriber,
} from "@copilotkit/core";
import type { AbstractAgent } from "@ag-ui/client";

export interface CopilotKitCoreAdapterState {
    /** Current runtime connection status. */
    connectionStatus: ShallowRef<CopilotKitCoreRuntimeConnectionStatus>;
    /** Live map of registered agents. Triggers Vue update on change. */
    agents: ShallowRef<Readonly<Record<string, AbstractAgent>>>;
    /** Unsubscribe from all core events. Called by CopilotKitProvider on unmount. */
    dispose(): void;
}

/**
 * Subscribe to top-level `CopilotKitCore` events and expose them as Vue
 * reactive refs. Returns a `dispose` function to clean up on provider unmount.
 */
export function createCopilotKitCoreAdapter(
    copilotkit: CopilotKitCore,
): CopilotKitCoreAdapterState {
    const connectionStatus = shallowRef<CopilotKitCoreRuntimeConnectionStatus>(
        CopilotKitCoreRuntimeConnectionStatus.Disconnected,
    );
    const agents = shallowRef<Readonly<Record<string, AbstractAgent>>>({});

    const subscriber: CopilotKitCoreSubscriber = {
        onRuntimeConnectionStatusChanged({ status }) {
            connectionStatus.value = status;
            triggerRef(connectionStatus);
        },
        onAgentsChanged({ agents: next }) {
            agents.value = next;
            triggerRef(agents);
        },
    };

    const subscription = copilotkit.subscribe(subscriber);

    return {
        connectionStatus,
        agents,
        dispose() {
            subscription.unsubscribe();
        },
    };
}
