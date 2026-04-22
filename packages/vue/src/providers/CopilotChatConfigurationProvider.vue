<script lang="ts">
/**
 * CopilotChatConfigurationProvider — scopes chat UI labels, threadId, and
 * modal open state to a subtree. Used by CopilotChat, CopilotSidebar, CopilotPopup.
 */
import { defineComponent, provide, ref, h } from "vue";
import {
  CopilotChatConfigurationKey,
  type CopilotChatConfiguration,
} from "./keys";

export default defineComponent({
  name: "CopilotChatConfigurationProvider",

  props: {
    threadId: { type: String, default: undefined },
    agentId: { type: String, default: undefined },
    labels: {
      type: Object as () => CopilotChatConfiguration["labels"],
      default: undefined,
    },
    isModalDefaultOpen: { type: Boolean, default: undefined },
  },

  setup(props, { slots }) {
    // Track modal open state reactively when this provider owns it.
    const modalOpen = ref<boolean>(props.isModalDefaultOpen ?? false);

    const config: CopilotChatConfiguration = {
      get threadId() { return props.threadId; },
      get agentId() { return props.agentId; },
      get labels() { return props.labels; },
      get isModalOpen() { return modalOpen.value; },
      setModalOpen(open: boolean) { modalOpen.value = open; },
    };

    provide(CopilotChatConfigurationKey, config);

    return () => slots.default?.();
  },

  render() {
    return h("slot");
  },
});
</script>
