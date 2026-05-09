<template>
  <main class="relative flex h-screen overflow-hidden bg-white">
    <aside
      class="flex h-full w-[268px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white"
    >
      <div class="border-b border-[#e5e7eb] px-3 py-3 h-[65px]">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b7cfa] to-[#8d9fff] text-sm font-semibold text-white"
          >
            C
          </div>
          <span class="text-sm font-semibold text-[#111827]"
            >CocosForge AI</span
          >
        </div>
      </div>
      <div class="border-b border-[#e5e7eb] px-3 py-3">
        <button
          class="flex w-full items-center justify-between rounded-xl border border-[#d9deea] bg-white px-3 py-2 text-left text-[#2552d9] transition hover:bg-white"
          @click="handleCreateSession"
        >
          <span class="text-[15px] font-semibold">✎ 新对话</span>
          <span
            class="rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] text-[#6b7fcf]"
            >Ctrl K</span
          >
        </button>
        <div class="mt-3 space-y-1 text-[15px] text-[#111827]">
          <button
            class="flex w-full items-center gap-2 rounded-lg bg-white px-2 py-2 text-left hover:bg-white"
          >
            <span>◻️</span>
            <span>更多</span>
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 px-3 py-3">
        <div class="mb-2 px-2 text-sm text-[#9ca3af]">历史对话</div>
        <div class="h-full space-y-1 overflow-y-auto pr-1">
          <button
            v-for="session in store.sessions"
            :key="session.id"
            class="w-full rounded-xl border px-3 py-2 text-left transition"
            :class="
              session.id === store.currentSessionId
                ? 'border-[#e8eaef] bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                : 'border-transparent bg-transparent text-[#374151] hover:border-[#e8eaef] hover:bg-white'
            "
            @click="onSessionValueChange(session.id)"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs text-[#b1b7c4]">◉</span>
              <span class="truncate text-[15px] font-medium">
                {{ session.name || "新游戏项目" }}
              </span>
            </div>
            <div class="mt-1 pl-5 text-xs text-[#a0a7b5]">
              {{ session.status }}
            </div>
          </button>
        </div>
      </div>

      <div class="border-t border-[#e5e7eb] px-3 py-3">
        <button
          class="flex w-full items-center gap-2 rounded-xl bg-white px-2 py-2 text-left hover:bg-white"
        >
          <div
            class="flex h-7 w-7 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-[#1e3a8a]"
          >
            U
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-[#111827]">
              阿卜嚓咔
            </div>
            <div class="truncate text-xs text-[#9ca3af]">普通用户</div>
          </div>
        </button>
      </div>
    </aside>

    <section class="flex min-w-0 flex-1 flex-col">
      <header
        class="z-20 shrink-0 border-b border-[#e8ebf2] bg-white/95 backdrop-blur"
      >
        <div class="relative flex h-[65px] w-full items-center px-[20px]">
          <div class="absolute left-1/2 max-w-[70%] -translate-x-1/2 truncate text-sm font-semibold text-[#111827]">
            {{ currentSessionTitle }}
          </div>
          <div class="ml-auto">
            <el-tag type="info" effect="plain" round>{{
              store.statusText
            }}</el-tag>
          </div>
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-hidden px-[20px] py-[20px]">
        <div class="h-full min-w-0">
          <ChatPanel
            :session-id="store.currentSessionId"
            :messages="store.messages"
            :dynamic-form="store.dynamicForm"
            :loading="store.loading"
            :preview-visible="previewVisible"
            :pending-preview="pendingPreview"
            @send-message="handleSendMessage"
            @submit-form="handleSubmitForm"
            @reset-conversation="store.resetConversation"
            @toggle-preview="togglePreviewPanel"
          />
        </div>
      </div>
    </section>

    <PreviewPanel
      ref="previewRef"
      :visible="previewVisible"
      :preview-url="store.previewUrl"
      :session-id="store.currentSessionId"
      :has-preview="hasPreview"
      @close="previewVisible = false"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import ChatPanel from "./components/chat/ChatPanel.vue";
import PreviewPanel from "./components/preview/PreviewPanel.vue";
import { useChatStore } from "./stores/chat";

const store = useChatStore();
const previewRef = ref<InstanceType<typeof PreviewPanel> | null>(null);
const previewVisible = ref(false);
const pendingPreview = ref(false);

onMounted(async () => {
  await store.refreshSessions();
  if (!store.currentSessionId) {
    await store.createNewSession("默认会话");
  }
});

watch(
  () => store.previewUrl,
  () => {
    previewRef.value?.refresh();
    if (!previewVisible.value && store.previewUrl) {
      pendingPreview.value = true;
    }
  },
);

const hasPreview = computed(() => Boolean(store.previewUrl));
const currentSessionTitle = computed(() => {
  const firstUserMessage = store.messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0,
  );
  if (firstUserMessage) {
    return firstUserMessage.content.split("\n")[0].trim();
  }
  return store.currentSession?.name || "新对话";
});

async function handleSendMessage(message: string) {
  await store.sendMessage(message);
}

async function handleSubmitForm(payload: Record<string, string | number>) {
  await store.sendMessage(
    "根据你给的补充信息，请继续完成策划与代码生成。",
    payload,
  );
}

async function handleCreateSession() {
  await store.createNewSession();
}

async function handleSwitchSession(id: string) {
  await store.switchSession(id);
}

function onSessionValueChange(id: string | number) {
  void handleSwitchSession(String(id));
}

function togglePreviewPanel() {
  previewVisible.value = !previewVisible.value;
  if (previewVisible.value) {
    pendingPreview.value = false;
  }
}
</script>
