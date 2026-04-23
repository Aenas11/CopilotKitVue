import { h, toValue, type Component, type MaybeRefOrGetter } from "vue";
import type { StandardSchemaV1, InferSchemaOutput } from "@copilotkit/shared";
import { useFrontendTool } from "./useFrontendTool";
import { useRenderTool } from "./useRenderTool";
import type { ToolCallRenderInput } from "../adapters/toolCallRenderRegistry";

type InferRenderProps<T> = T extends StandardSchemaV1
  ? InferSchemaOutput<T>
  : Record<string, unknown>;

export interface UseComponentOptions<
  TSchema extends StandardSchemaV1 | undefined = undefined,
> {
  /** Tool name used by the model to invoke this component. */
  name: string;
  /** Optional description appended after the default tool instructions. */
  description?: string;
  /** Optional Standard Schema V1 describing the tool parameters. */
  parameters?: TSchema;
  /** The Vue component to render when the tool is called. */
  component: Component;
  /** Optional agent ID to scope this registration to a specific agent. */
  agentId?: string;
}

/**
 * Registers a named Vue component so the agent can invoke it as a tool and
 * render it in the chat as Generative UI.
 *
 * Mirrors the React `useComponent` hook — registers the tool for model
 * discoverability via `useFrontendTool` and the visual renderer via
 * `useRenderTool`. Both registrations are cleaned up on unmount.
 *
 * @example
 * ```ts
 * useComponent({
 *   name: "showWeatherCard",
 *   description: "Displays current weather for a city.",
 *   parameters: z.object({ city: z.string() }),
 *   component: WeatherCard,
 * });
 * ```
 */
export function useComponent<
  TSchema extends StandardSchemaV1 | undefined = undefined,
>(
  options: MaybeRefOrGetter<UseComponentOptions<TSchema>>,
  deps?: MaybeRefOrGetter<unknown>[],
): void {
  // Register the tool so the model can discover and call it.
  useFrontendTool(
    () => {
      const resolved = toValue(options);
      const prefix = `Use this tool to display the "${resolved.name}" component in the chat. This tool renders a visual UI component for the user.`;
      const description = resolved.description
        ? `${prefix}\n\n${resolved.description}`
        : prefix;
      return {
        name: resolved.name,
        description,
        parameters: resolved.parameters,
        agentId: resolved.agentId,
      };
    },
    deps,
  );

  // Register the Vue component as the visual renderer for this tool call.
  useRenderTool(
    () => {
      const resolved = toValue(options);
      return {
        name: resolved.name,
        agentId: resolved.agentId,
        render: (input: ToolCallRenderInput) =>
          h(
            resolved.component,
            input.args as InferRenderProps<TSchema>,
          ),
      };
    },
    deps,
  );
}
