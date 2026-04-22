import { shallowRef, triggerRef, onUnmounted } from "vue";
import {
  CopilotKitCoreRuntimeConnectionStatus,
} from "@copilotkit/core";
import { useCopilotKit } from "./useCopilotKit";

export interface UseCapabilitiesReturn {
  connectionStatus: ReturnType<typeof shallowRef<CopilotKitCoreRuntimeConnectionStatus>>;
}

/**
 * Exposes reactive runtime capability flags from the nearest provider.
 * Mirrors the React `useCapabilities` hook.
 */
export function useCapabilities(): UseCapabilitiesReturn {
  const { copilotkit } = useCopilotKit();
  const connectionStatus =
    shallowRef<CopilotKitCoreRuntimeConnectionStatus>(
      CopilotKitCoreRuntimeConnectionStatus.Disconnected,
    );

  const sub = copilotkit.subscribe({
    onRuntimeConnectionStatusChanged({ status }) {
      connectionStatus.value = status;
      triggerRef(connectionStatus);
    },
  });

  onUnmounted(() => sub.unsubscribe());

  return { connectionStatus };
}
