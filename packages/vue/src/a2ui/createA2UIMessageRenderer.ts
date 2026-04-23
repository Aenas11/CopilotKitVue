import { h, type Component } from "vue";
import type { ActivityMessage } from "@ag-ui/core";
import type { AbstractAgent } from "@ag-ui/client";
import type {
    ActivityMessageRenderer,
    SafeParseSchema,
} from "../composables/useRenderActivityMessage";

export const A2UI_OPERATIONS_KEY = "a2ui_operations";

export interface A2UIMessageRendererOptions {
    theme?: unknown;
    catalog?: unknown;
    loadingComponent?: Component;
}

export interface A2UIActivityRenderProps {
    activityType: string;
    content: unknown;
    message: ActivityMessage;
    agent: AbstractAgent | undefined;
}

const anySchema: SafeParseSchema<unknown> = {
    safeParse(value: unknown) {
        return { success: true, data: value };
    },
};

/**
 * Vue parity factory for React's createA2UIMessageRenderer.
 *
 * This implementation keeps the same surface API and activityType contract
 * ("a2ui-surface") while returning a lightweight built-in fallback view.
 */
export function createA2UIMessageRenderer(
    options: A2UIMessageRendererOptions,
): ActivityMessageRenderer<unknown> {
    return {
        activityType: "a2ui-surface",
        content: anySchema,
        render: ({ content }: A2UIActivityRenderProps) => {
            const operations =
                content && typeof content === "object"
                    ? ((content as Record<string, unknown>)[A2UI_OPERATIONS_KEY] as unknown[] | undefined)
                    : undefined;

            if (!Array.isArray(operations) || operations.length === 0) {
                if (options.loadingComponent) {
                    return h(options.loadingComponent);
                }
                return h(
                    "div",
                    {
                        style:
                            "padding:10px 12px;border-radius:10px;border:1px solid #dbeafe;background:#eff6ff;color:#1e3a8a;font-size:12px;display:inline-block;",
                    },
                    "Building A2UI surface...",
                );
            }

            return h(
                "div",
                {
                    style:
                        "padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:12px;display:inline-flex;flex-direction:column;gap:4px;",
                    "data-testid": "cpk-a2ui-surface-fallback",
                },
                [
                    h("strong", "A2UI surface"),
                    h("span", `${operations.length} operation(s) received`),
                ],
            );
        },
    };
}
