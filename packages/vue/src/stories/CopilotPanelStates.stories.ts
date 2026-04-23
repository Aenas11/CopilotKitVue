import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import CopilotChatConfigurationProvider from "../providers/CopilotChatConfigurationProvider.vue";
import CopilotSidebarView from "../components/layout/CopilotSidebarView.vue";
import CopilotPopupView from "../components/layout/CopilotPopupView.vue";

const meta = {
    title: "Components/Layout/Panel States",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SidebarOpen: Story = {
    render: () => ({
        components: {
            CopilotChatConfigurationProvider,
            CopilotSidebarView,
        },
        template:
            `<CopilotChatConfigurationProvider :is-modal-default-open="true" :labels="{ title: 'Assistant' }"><CopilotSidebarView :width="420"><div style="padding: 12px;">Sidebar content state</div></CopilotSidebarView></CopilotChatConfigurationProvider>`,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Sidebar content state")).toBeTruthy();
        await expect(canvasElement.querySelector(".cpk-sidebar.is-open")).toBeTruthy();
    },
};

export const PopupOpen: Story = {
    render: () => ({
        components: {
            CopilotChatConfigurationProvider,
            CopilotPopupView,
        },
        template:
            `<CopilotChatConfigurationProvider :is-modal-default-open="true" :labels="{ title: 'Assistant' }"><CopilotPopupView :width="420" :height="460"><div style="padding: 12px;">Popup content state</div></CopilotPopupView></CopilotChatConfigurationProvider>`,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Popup content state")).toBeTruthy();
        await expect(canvasElement.querySelector(".cpk-popup.is-open")).toBeTruthy();
    },
};
