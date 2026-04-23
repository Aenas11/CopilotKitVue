import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

// ── Demo component ────────────────────────────────────────────────────────────
// Directly models what a component using `useHumanInTheLoop` would render.
// Uses a local ref to simulate the composable state so the story is
// deterministic (no live agent required).

const InterruptDemoContent = defineComponent({
    name: "InterruptDemoContent",
    props: {
        /** Pre-seed isPending so individual stories can control initial state. */
        initialPending: { type: Boolean, default: false },
        /** The interrupt question shown to the user. */
        interruptQuestion: {
            type: String,
            default: "Should we proceed with deploying version 2.1.4 to production?",
        },
    },
    setup(props) {
        const isPending = ref(props.initialPending);
        const interruptValue = ref<string | null>(
            props.initialPending ? props.interruptQuestion : null,
        );
        const lastDecision = ref<string | null>(null);
        const answerInput = ref("");

        function simulateInterrupt() {
            isPending.value = true;
            interruptValue.value = props.interruptQuestion;
            lastDecision.value = null;
            answerInput.value = "";
        }

        function resolve() {
            const answer = answerInput.value.trim() || "approved";
            lastDecision.value = `Resolved: "${answer}"`;
            isPending.value = false;
            interruptValue.value = null;
            answerInput.value = "";
        }

        function reject() {
            lastDecision.value = "Rejected: run cancelled";
            isPending.value = false;
            interruptValue.value = null;
            answerInput.value = "";
        }

        return { isPending, interruptValue, lastDecision, answerInput, simulateInterrupt, resolve, reject };
    },
    template: `
      <div style="width: 500px; font-family: sans-serif; padding: 20px;">

        <!-- Why this feature is needed -->
        <div
          data-testid="why-hitl"
          style="margin-bottom: 16px; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #334155; font-size: 12px; line-height: 1.45;"
        >
          <strong>Why this feature is needed</strong>
          <div style="margin-top: 4px;">
            Long-running agent workflows sometimes need human approval before taking
            a sensitive or irreversible action. <code>useHumanInTheLoop</code> surfaces
            LangGraph interrupt events as reactive <code>isPending</code> state so Vue
            components can pause the agent, show an approval prompt, and resume or
            cancel the run — all within the normal Vue reactivity model.
          </div>
        </div>

        <!-- Trigger button (only shown when not pending) -->
        <div v-if="!isPending" style="margin-bottom: 16px;">
          <button
            data-testid="simulate-interrupt-btn"
            @click="simulateInterrupt"
            style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
          >
            Simulate Agent Interrupt
          </button>
        </div>

        <!-- Interrupt prompt (shown when isPending) -->
        <div
          v-if="isPending"
          data-testid="interrupt-prompt"
          style="padding: 16px; border: 2px solid #f59e0b; border-radius: 10px; background: #fffbeb;"
        >
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <span style="font-size: 20px;">⚠️</span>
            <strong style="color: #92400e; font-size: 14px;">Agent requires approval</strong>
          </div>
          <p data-testid="interrupt-question" style="margin: 0 0 12px; font-size: 13px; color: #374151;">
            {{ interruptValue }}
          </p>
          <textarea
            v-model="answerInput"
            data-testid="answer-input"
            placeholder="Optional: add a note with your decision..."
            style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; resize: vertical; min-height: 60px; margin-bottom: 10px;"
          />
          <div style="display: flex; gap: 8px;">
            <button
              data-testid="approve-btn"
              @click="resolve"
              style="flex: 1; padding: 8px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;"
            >
              ✓ Approve &amp; Resume
            </button>
            <button
              data-testid="reject-btn"
              @click="reject"
              style="flex: 1; padding: 8px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;"
            >
              ✗ Cancel Run
            </button>
          </div>
        </div>

        <!-- Decision result -->
        <div
          v-if="lastDecision"
          data-testid="decision-result"
          style="margin-top: 14px; padding: 10px 12px; border: 1px solid #d1fae5; border-radius: 8px; background: #ecfdf5; color: #065f46; font-size: 13px;"
        >
          {{ lastDecision }}
        </div>
      </div>
    `,
});

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
    title: "Scenarios/Deterministic/Human In The Loop",
    component: InterruptDemoContent,
    tags: ["test", "autodocs"],
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "Demonstrates the `useHumanInTheLoop` composable (Phase B). " +
                    "When a LangGraph agent calls `interrupt()`, the run pauses and " +
                    "`isPending` becomes `true`. The UI shows an approval prompt; " +
                    "`resolve(answer)` resumes the agent with the human's response while " +
                    "`reject()` stops the run entirely. " +
                    "This pattern is essential for agentic workflows that perform sensitive " +
                    "or irreversible actions (deploys, deletions, financial transactions) and " +
                    "need human sign-off before continuing.",
            },
        },
    },
} satisfies Meta<typeof InterruptDemoContent>;

export default meta;

type Story = StoryObj<typeof meta>;

// ── Story 1: default idle state ───────────────────────────────────────────────

export const IdleState: Story = {
    name: "Idle — no interrupt",
    parameters: {
        docs: {
            description: {
                story:
                    "The default state before any interrupt fires. " +
                    "Click **Simulate Agent Interrupt** to see the approval prompt appear.",
            },
        },
    },
    args: {
        initialPending: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Rationale callout is always visible
        await expect(canvas.getByTestId("why-hitl")).toBeVisible();

        // Trigger button visible; prompt hidden
        await expect(canvas.getByTestId("simulate-interrupt-btn")).toBeVisible();
        await expect(canvas.queryByTestId("interrupt-prompt")).toBeNull();

        // Click to trigger interrupt
        await userEvent.click(canvas.getByTestId("simulate-interrupt-btn"));

        // Prompt now visible
        await expect(canvas.getByTestId("interrupt-prompt")).toBeVisible();
        await expect(canvas.getByTestId("interrupt-question")).toBeVisible();
    },
};

// ── Story 2: pending interrupt with resolve ───────────────────────────────────

export const PendingApprove: Story = {
    name: "Pending — approve with note",
    parameters: {
        docs: {
            description: {
                story:
                    "The agent has fired a `LangGraphInterruptEvent`; `isPending` is already `true`. " +
                    "The user types an approval note and clicks **Approve & Resume**. " +
                    "The composable calls `resolve(answer)`, which sets " +
                    "`__copilotkit_interrupt_response` on agent state and re-invokes `runAgent`.",
            },
        },
    },
    args: {
        initialPending: true,
        interruptQuestion: "Should we proceed with deploying version 2.1.4 to production?",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Interrupt prompt is immediately visible
        await expect(canvas.getByTestId("interrupt-prompt")).toBeVisible();
        await expect(canvas.getByTestId("interrupt-question")).toHaveTextContent(
            "Should we proceed with deploying version 2.1.4 to production?",
        );

        // Type an approval note
        const input = canvas.getByTestId("answer-input");
        await userEvent.type(input, "Approved by on-call engineer");

        // Click Approve
        await userEvent.click(canvas.getByTestId("approve-btn"));

        // Prompt gone, decision visible
        await expect(canvas.queryByTestId("interrupt-prompt")).toBeNull();
        await expect(canvas.getByTestId("decision-result")).toHaveTextContent(
            'Resolved: "Approved by on-call engineer"',
        );
    },
};

// ── Story 3: pending interrupt with reject ────────────────────────────────────

export const PendingReject: Story = {
    name: "Pending — cancel run",
    parameters: {
        docs: {
            description: {
                story:
                    "The user clicks **Cancel Run** instead of approving. " +
                    "The composable calls `reject()`, which invokes `stopAgent` and clears " +
                    "the interrupt state without resuming the run.",
            },
        },
    },
    args: {
        initialPending: true,
        interruptQuestion: "Permanently delete 847 archived records. Are you sure?",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByTestId("interrupt-prompt")).toBeVisible();
        await expect(canvas.getByTestId("interrupt-question")).toHaveTextContent(
            "Permanently delete 847 archived records. Are you sure?",
        );

        await userEvent.click(canvas.getByTestId("reject-btn"));

        await expect(canvas.queryByTestId("interrupt-prompt")).toBeNull();
        await expect(canvas.getByTestId("decision-result")).toHaveTextContent(
            "Rejected: run cancelled",
        );
    },
};
