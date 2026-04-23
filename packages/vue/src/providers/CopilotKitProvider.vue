<script lang="ts">
/**
 * CopilotKitProvider — root Vue provider for CopilotKit.
 *
 * Mirrors the React `CopilotKitProvider` props. Instantiates a
 * `CopilotKitCore` instance and makes it available to the entire
 * component tree via `provide(CopilotKitKey, ...)`.
 *
 * @example
 * Use at app root with a runtime endpoint (for example `/api/copilotkit`).
 */
import { defineComponent, provide, watch, onUnmounted, h } from "vue";
import { CopilotKitCore, type CopilotKitCoreConfig } from "@copilotkit/core";
import type { AbstractAgent } from "@ag-ui/client";
import { CopilotKitKey, type CopilotKitContext } from "./keys";

export default defineComponent({
  name: "CopilotKitProvider",

  props: {
    /** Endpoint of the CopilotRuntime (e.g. "/api/copilotkit"). */
    runtimeUrl: {
      type: String,
      default: undefined,
    },
    /** Extra HTTP headers sent with every request. */
    headers: {
      type: Object as () => Record<string, string>,
      default: undefined,
    },
    /** Credentials mode for fetch requests. */
    credentials: {
      type: String as () => RequestCredentials,
      default: undefined,
    },
    /** Additional properties forwarded to the AG-UI agent. */
    properties: {
      type: Object as () => Record<string, unknown>,
      default: undefined,
    },
    /**
     * Dev-only: map of pre-constructed agent instances. In production, use
     * `runtimeUrl` pointing to a CopilotRuntime instead.
     */
    agentsUnsafeDevOnly: {
      type: Object as () => Record<string, AbstractAgent>,
      default: undefined,
    },
    /** Default thread ID passed to child `useAgent` calls. */
    threadId: {
      type: String,
      default: undefined,
    },
    /**
     * Default throttle interval (ms) for agent subscription callbacks.
     * `0` disables throttling. Individual composables can override this.
     */
    defaultThrottleMs: {
      type: Number,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    const buildConfig = (): CopilotKitCoreConfig => ({
      runtimeUrl: props.runtimeUrl,
      headers: props.headers,
      credentials: props.credentials,
      properties: props.properties,
      agents__unsafe_dev_only: props.agentsUnsafeDevOnly,
    });

    const copilotkit = new CopilotKitCore(buildConfig());

    const context: CopilotKitContext = {
      copilotkit,
      threadId: props.threadId,
      defaultThrottleMs: props.defaultThrottleMs,
    };

    provide(CopilotKitKey, context);

    // Keep core config in sync when parent props change.
    watch(
      () => props.headers,
      (headers) => {
        if (headers) copilotkit.setHeaders(headers);
      },
      { deep: true },
    );

    watch(
      () => props.properties,
      (properties) => {
        if (properties) copilotkit.setProperties(properties);
      },
      { deep: true },
    );

    onUnmounted(() => {
      // CopilotKitCore has no dispose method — subscriptions are cleaned up elsewhere.
    });

    return () => slots.default?.();
  },

  render() {
    return h("slot");
  },
});
</script>
