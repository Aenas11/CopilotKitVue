import CopilotChatConfigurationProvider from "../providers/CopilotChatConfigurationProvider.vue";
import CopilotSidebarView from "../components/layout/CopilotSidebarView.vue";
import CopilotPopupView from "../components/layout/CopilotPopupView.vue";

const meta = {
    title: "Layout/Panel States",
};

export default meta;

export const SidebarOpen = {
    render: () => ({
        components: {
            CopilotChatConfigurationProvider,
            CopilotSidebarView,
        },
        template:
            `<CopilotChatConfigurationProvider :is-modal-default-open="true" :labels="{ title: 'Assistant' }"><CopilotSidebarView :width="420"><div style="padding: 12px;">Sidebar content state</div></CopilotSidebarView></CopilotChatConfigurationProvider>`,
    }),
};

export const PopupOpen = {
    render: () => ({
        components: {
            CopilotChatConfigurationProvider,
            CopilotPopupView,
        },
        template:
            `<CopilotChatConfigurationProvider :is-modal-default-open="true" :labels="{ title: 'Assistant' }"><CopilotPopupView :width="420" :height="460"><div style="padding: 12px;">Popup content state</div></CopilotPopupView></CopilotChatConfigurationProvider>`,
    }),
};
