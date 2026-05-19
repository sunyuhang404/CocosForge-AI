<template>
  <main class="home-main flex min-w-0 flex-1 flex-col">
    <div class="home-chat-wrap min-h-0 flex-1 overflow-hidden px-[20px] py-[20px]">
      <div class="home-chat-inner h-full min-w-0">
        <ChatPanel
          v-bind="chatPanelProps"
          @send-message="store.sendMessage"
          @submit-form="handleSubmitForm"
          @reset-conversation="store.resetConversation"
          @toggle-preview="togglePreview"
        />
      </div>
    </div>

    <PreviewPanel
      ref="previewPanelRef"
      v-bind="previewPanelProps"
      @close="hidePreview"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ChatPanel from "./components/chat/ChatPanel.vue";
import PreviewPanel from "./components/preview/PreviewPanel.vue";
import { useChatStore } from "@/stores/chat";

const CONTINUE_WITH_FORM_MESSAGE = "根据你给的补充信息，请继续完成策划与代码生成。";

const store = useChatStore();
const previewPanelRef = ref<InstanceType<typeof PreviewPanel> | null>(null);
const previewVisible = ref(false);
const pendingPreview = ref(false);
const hasPreview = computed(() => Boolean(store.previewUrl));

watch(
  () => store.previewUrl,
  (previewUrl) => {
    previewPanelRef.value?.refresh();
    pendingPreview.value = Boolean(previewUrl) && !previewVisible.value;
  },
);

const chatPanelProps = computed(() => ({
  sessionId: store.currentSessionId,
  messages: store.messages,
  dynamicForm: store.dynamicForm,
  loading: store.loading,
  statusText: store.statusText,
  codegenProgressPercent: store.codegenProgressPercent,
  codegenProgressDetail: store.codegenProgressDetail,
  previewVisible: previewVisible.value,
  pendingPreview: pendingPreview.value,
}));

const previewPanelProps = computed(() => ({
  visible: previewVisible.value,
  previewUrl: store.previewUrl,
  sessionId: store.currentSessionId,
  hasPreview: hasPreview.value,
}));

async function handleSubmitForm(payload: Record<string, string | number>) {
  await store.sendMessage(CONTINUE_WITH_FORM_MESSAGE, payload);
}

function hidePreview() {
  previewVisible.value = false;
}

function togglePreview() {
  previewVisible.value = !previewVisible.value;
  if (previewVisible.value) {
    pendingPreview.value = false;
  }
}
</script>
