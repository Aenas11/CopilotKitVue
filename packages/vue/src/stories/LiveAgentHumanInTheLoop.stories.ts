import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import CopilotChat from "../components/chat/CopilotChat.vue";
import { useFrontendTool } from "../composables/useFrontendTool";
import { StoryRuntimeProvider, liveAgentAdvancedParameters, liveAgentPurposeDecorator } from "./liveAgentStoryShared";

const meta = {
    title: "Workflows/Live Agent/Advanced Scenarios/Human In The Loop",
    tags: ["live-agent", "advanced", "autodocs"],
    decorators: [liveAgentPurposeDecorator],
    parameters: {
        ...liveAgentAdvancedParameters,
        docs: {
            description: {
                component:
                    "Runtime-backed approval workflow demo using the existing `my_agent` plus a frontend-provided `request_user_approval` tool. " +
                    "This mirrors the AG-UI human-in-the-loop pattern: the agent asks the UI for approval before a sensitive action, the operator responds in-app, and the agent continues with that decision.",
            },
        },
    },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type ApprovalRequest = {
    context?: string;
    message: string;
};

type ApprovalDecision = {
    approved: boolean;
    reason?: string;
};

type PendingApproval = ApprovalRequest & {
    resolve: (value: ApprovalDecision) => void;
};

const supportTickets = [
    {
        id: "#12345",
        customer: "Jordan Rivera",
        subject: "Refund request - duplicate charge",
        recommendedPrompt: "Approve a $50 refund to Jordan Rivera on ticket #12345 for the duplicate charge.",
        status: "Open",
    },
    {
        id: "#12346",
        customer: "Priya Shah",
        subject: "Downgrade plan to Starter",
        recommendedPrompt: "Downgrade Priya Shah on ticket #12346 to the Starter plan next billing cycle.",
        status: "Open",
    },
    {
        id: "#12347",
        customer: "Morgan Lee",
        subject: "Escalate payment issue",
        recommendedPrompt: "Escalate ticket #12347 for Morgan Lee to the payments team.",
        status: "Escalating",
    },
];

const LiveApprovalContent = defineComponent({
    name: "LiveApprovalContent",
    components: { CopilotChat },
    setup() {
        const pendingApproval = ref<PendingApproval | null>(null);
        const lastDecision = ref<string>("No approval decision yet.");
        const note = ref("");

        useFrontendTool({
            agentId: "my_agent",
            name: "request_user_approval",
            description:
                "Ask the operator to approve or reject a sensitive action before continuing. " +
                "Use this before refunds, customer-impacting account changes, escalations, deletions, or any irreversible action. " +
                "Pass `message` as a short plain-English summary and optionally pass `context` with ticket or policy details.",
            handler: async ({ context, message }: ApprovalRequest) =>
                await new Promise<ApprovalDecision>((resolve) => {
                    note.value = "";
                    pendingApproval.value = { context, message, resolve };
                }),
        });

        const closeDialog = () => {
            pendingApproval.value = null;
            note.value = "";
        };

        const respond = (approved: boolean) => {
            const current = pendingApproval.value;
            if (!current) {
                return;
            }

            const trimmedReason = note.value.trim();
            current.resolve({
                approved,
                reason: trimmedReason.length > 0 ? trimmedReason : undefined,
            });
            lastDecision.value = approved
                ? `Approved: ${current.message}${trimmedReason ? ` (${trimmedReason})` : ""}`
                : `Rejected: ${current.message}${trimmedReason ? ` (${trimmedReason})` : ""}`;
            closeDialog();
        };

        return {
            lastDecision,
            note,
            pendingApproval,
            respond,
            supportTickets,
        };
    },
    template: `
      <div style="display: grid; grid-template-columns: 340px minmax(0, 1fr); height: 100vh; background: #f8fafc;">
        <aside style="border-right: 1px solid #dbe3ef; padding: 18px 16px; overflow-y: auto; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
          <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; font-weight: 700;">Support Console</div>
          <h2 style="margin: 8px 0 10px; font-size: 24px; line-height: 1.15; color: #0f172a;">Human approval before action</h2>
          <p style="margin: 0 0 14px; color: #475569; line-height: 1.5; font-size: 13px;">
            Ask the live agent to take a customer-affecting action. The story registers a frontend
            approval tool, so the agent should pause and ask for approval before proceeding.
          </p>

          <div style="margin-bottom: 16px; padding: 12px; border-radius: 12px; border: 1px solid #dbe3ef; background: #fefce8; color: #713f12; font-size: 12px; line-height: 1.45;">
            Try one of these prompts in chat:
            <div style="margin-top: 6px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; color: #854d0e;">
              - Approve a $50 refund to Jordan Rivera on ticket #12345 for the duplicate charge.<br>
              - Downgrade Priya Shah on ticket #12346 to the Starter plan next billing cycle.<br>
              - Escalate ticket #12347 for Morgan Lee to the payments team.
            </div>
          </div>

          <div style="display: grid; gap: 10px;">
            <article
              v-for="ticket in supportTickets"
              :key="ticket.id"
              style="padding: 12px; border-radius: 12px; border: 1px solid #dbe3ef; background: #ffffff; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
                <strong style="color: #0f172a; font-size: 13px;">{{ ticket.id }}</strong>
                <span style="font-size: 11px; color: #0369a1; background: #e0f2fe; border-radius: 999px; padding: 3px 8px;">{{ ticket.status }}</span>
              </div>
              <div style="font-size: 13px; color: #0f172a; font-weight: 600;">{{ ticket.customer }}</div>
              <div style="font-size: 12px; color: #475569; margin: 4px 0 8px; line-height: 1.4;">{{ ticket.subject }}</div>
              <div style="padding: 8px 9px; background: #f8fafc; border-radius: 8px; font-size: 11px; color: #334155; line-height: 1.4; border: 1px solid #e2e8f0;">
                {{ ticket.recommendedPrompt }}
              </div>
            </article>
          </div>

          <div style="margin-top: 16px; padding: 12px; border-radius: 12px; border: 1px solid #cbd5e1; background: #ffffff;">
            <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px;">Last decision</div>
            <div style="font-size: 12px; color: #334155; line-height: 1.45;">{{ lastDecision }}</div>
          </div>
        </aside>

        <main style="position: relative; min-width: 0; background: #ffffff;">
          <CopilotChat
            agent-id="my_agent"
            :labels="{ title: 'Live HITL Agent', placeholder: 'Ask the agent to refund, downgrade, or escalate...' }"
          />

          <div
            v-if="pendingApproval"
            style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.4); padding: 24px;"
          >
            <div style="width: min(100%, 520px); border-radius: 18px; background: #ffffff; box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28); border: 1px solid #dbe3ef; padding: 20px;">
              <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #b45309; font-weight: 700; margin-bottom: 8px;">Approval required</div>
              <h3 style="margin: 0 0 8px; color: #0f172a; font-size: 22px; line-height: 1.2;">{{ pendingApproval.message }}</h3>
              <p v-if="pendingApproval.context" style="margin: 0 0 14px; padding: 10px 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; font-size: 13px; line-height: 1.45;">
                {{ pendingApproval.context }}
              </p>
              <label for="approval-note" style="display: block; font-size: 12px; color: #334155; font-weight: 600; margin-bottom: 6px;">Operator note</label>
              <textarea
                id="approval-note"
                v-model="note"
                placeholder="Optional note for the agent"
                style="width: 100%; min-height: 78px; resize: vertical; box-sizing: border-box; padding: 10px 12px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 13px; color: #0f172a;"
              />
              <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px;">
                <button
                  type="button"
                  @click="respond(false)"
                  style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; cursor: pointer; font-size: 13px; font-weight: 600;"
                >
                  Reject
                </button>
                <button
                  type="button"
                  @click="respond(true)"
                  style="padding: 10px 14px; border-radius: 10px; border: none; background: #0f766e; color: #ffffff; cursor: pointer; font-size: 13px; font-weight: 600;"
                >
                  Approve and continue
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    `,
});

export const ApprovalWorkflowLive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    "Why needed: validates a real approval gate between the live agent and host UI. " +
                    "Use this to confirm the agent can call a frontend approval tool, pause for an operator decision, and then continue or stop based on that result.",
            },
        },
    },
    render: () => ({
        components: {
            LiveApprovalContent,
            StoryRuntimeProvider,
        },
        data() {
            return {
                threadId: `story-hitl-live-${Date.now()}`,
            };
        },
        template: `
          <StoryRuntimeProvider runtime-url="/api/copilotkit" :thread-id="threadId">
            <LiveApprovalContent />
          </StoryRuntimeProvider>
        `,
    }),
};