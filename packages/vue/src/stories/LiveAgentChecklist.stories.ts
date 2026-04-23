import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta = {
    title: "Scenarios/Live Agent Checklist",
    tags: ["live-agent", "smoke", "autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Manual smoke checklist for validating real runtime and agent behavior from Storybook.",
            },
        },
    },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const RuntimeBackedSmoke: Story = {
    render: () => ({
        template: `
          <section style="max-width: 880px; margin: 0 auto; padding: 16px 20px; line-height: 1.5;">
            <h2 style="margin-top: 0;">Live Agent Smoke Checklist</h2>
            <p>
              Use this checklist when validating real runtime and agent behavior.
              This scenario is intentionally manual and should be run with the examples-backed stack.
            </p>

            <h3>Start Services</h3>
            <pre style="padding: 12px; background: #f6f8fa; border-radius: 8px; overflow: auto;"><code>cd packages/vue
pnpm storybook:dev</code></pre>

            <ul>
              <li>Storybook UI: http://localhost:6006</li>
              <li>Runtime proxy target: http://localhost:4000/api/copilotkit</li>
              <li>Agent: http://localhost:8000</li>
            </ul>

            <h3>Smoke Steps</h3>
            <ol>
              <li>Open <strong>Scenarios/Live Agent Chat</strong> and select <strong>Copilot Chat Live</strong>.</li>
              <li>Send a prompt and verify assistant response appears.</li>
              <li>While running, verify Stop button appears and is actionable.</li>
              <li>Send a second prompt and verify thread continuity.</li>
              <li>Close and reopen panel (sidebar/popup) and verify UI state continuity.</li>
              <li>Confirm no runtime or agent errors in terminal output.</li>
            </ol>

            <h3>Pass Criteria</h3>
            <ul>
              <li>Messages round-trip through runtime and real agent.</li>
              <li>Running state transitions are visible and recover correctly.</li>
              <li>No unhandled errors in Storybook, runtime, or agent terminals.</li>
            </ul>
          </section>
        `,
    }),
};