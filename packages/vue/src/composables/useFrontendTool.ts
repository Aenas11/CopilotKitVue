import { onUnmounted, watch, toValue, type MaybeRefOrGetter } from "vue";
import type { FrontendTool } from "@copilotkit/core";
import { useCopilotKit } from "./useCopilotKit";

/**
 * Registers a frontend tool with the nearest `CopilotKitProvider` and
 * removes it when the component unmounts. Re-registers automatically
 * when `tool` or watched `deps` change.
 *
 * Mirrors the React `useFrontendTool` hook.
 *
 * @example
 * ```ts
 * useFrontendTool({
 *   name: 'get_weather',
 *   description: 'Fetch current weather for a city',
 *   parameters: { type: 'object', properties: { city: { type: 'string' } } },
 *   handler: async ({ city }) => fetchWeather(city),
 * })
 * ```
 */
export function useFrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  tool: MaybeRefOrGetter<FrontendTool<T>>,
  deps?: MaybeRefOrGetter<unknown>[],
): void {
  const { copilotkit } = useCopilotKit();

  const extraDeps: MaybeRefOrGetter<unknown>[] = deps ?? [];

  watch(
    [() => toValue(tool), ...extraDeps.map((d) => () => toValue(d))],
    ([resolved], [prev]) => {
      // Remove previous registration if the name changed.
      if (prev && (prev as FrontendTool<T>).name !== (resolved as FrontendTool<T>).name) {
        copilotkit.removeTool(
          (prev as FrontendTool<T>).name,
          (prev as FrontendTool<T>).agentId,
        );
      }
      const t = resolved as FrontendTool<T>;
      const existing = copilotkit.getTool({ toolName: t.name, agentId: t.agentId });
      if (existing) {
        copilotkit.removeTool(t.name, t.agentId);
      }
      copilotkit.addTool(t as FrontendTool<any>);
    },
    { immediate: true },
  );

  onUnmounted(() => {
    const t = toValue(tool);
    copilotkit.removeTool(t.name, t.agentId);
  });
}
