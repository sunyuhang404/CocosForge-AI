<template>
  <main class="home relative flex h-full overflow-hidden bg-white">
    <aside
      class="home-aside flex h-full w-[268px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white"
    >
      <div class="home-aside-actions border-b border-[#e5e7eb] px-3 py-3">
        <button
          class="home-new-session-button flex w-full items-center justify-between rounded-xl border border-[#d9deea] bg-white px-3 py-2 text-left text-[#2552d9] transition hover:bg-white"
          @click="handleCreateSession"
        >
          <span class="home-new-session-label text-[15px] font-semibold"
            >✎ 新对话</span
          >
          <span
            class="home-new-session-shortcut rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] text-[#6b7fcf]"
            >Ctrl K</span
          >
        </button>
        <div class="home-more-menu mt-3 space-y-1 text-[15px] text-[#111827]">
          <button
            class="home-more-button flex w-full items-center gap-2 rounded-lg bg-white px-2 py-2 text-left hover:bg-white"
          >
            <span>◻️</span>
            <span>更多</span>
          </button>
        </div>
      </div>

      <div class="home-history min-h-0 flex-1 px-3 py-3">
        <div class="home-history-title mb-2 px-2 text-sm text-[#9ca3af]">
          历史对话
        </div>
        <div class="home-history-list h-full space-y-1 overflow-y-auto pr-1">
          <button
            v-for="session in store.sessions"
            :key="session.id"
            class="home-session-item w-full rounded-xl border px-3 py-2 text-left transition"
            :class="
              session.id === store.currentSessionId
                ? 'home-session-item--active border-[#e8eaef] bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                : 'home-session-item--inactive border-transparent bg-transparent text-[#374151] hover:border-[#e8eaef] hover:bg-white'
            "
            @click="onSessionValueChange(session.id)"
          >
            <div class="home-session-row flex items-center gap-2">
              <span class="home-session-dot text-xs text-[#b1b7c4]">◉</span>
              <span class="home-session-title truncate text-[15px] font-medium">
                {{ displaySessionTitle(session) }}
              </span>
            </div>
            <div class="home-session-status mt-1 pl-5 text-xs text-[#a0a7b5]">
              {{ session.status }}
            </div>
          </button>
        </div>
      </div>

      <div class="home-account border-t border-[#e5e7eb] px-3 py-3">
        <button
          v-if="auth.user"
          class="home-account-button flex w-full items-center gap-2 rounded-xl bg-white px-2 py-2 text-left hover:bg-white"
          @click="handleLogout"
        >
          <div
            class="home-account-avatar flex h-7 w-7 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-[#1e3a8a]"
          >
            {{ userInitial }}
          </div>
          <div class="home-account-info min-w-0">
            <div
              class="home-account-name truncate text-sm font-medium text-[#111827]"
            >
              {{ auth.user.displayName || auth.user.email }}
            </div>
            <div class="home-account-role truncate text-xs text-[#9ca3af]">
              点击退出登录
            </div>
          </div>
        </button>
        <div v-else class="home-auth-actions grid grid-cols-2 gap-2">
          <button
            class="home-login-button rounded-xl border border-[#d9deea] px-3 py-2 text-sm font-semibold text-[#2552d9] transition hover:bg-[#f7f9ff]"
            @click="onLogin"
          >
            登录
          </button>
          <button
            class="home-register-button rounded-xl bg-[#2552d9] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1f46bb]"
            @click="openRegisterDialog()"
          >
            注册
          </button>
        </div>
      </div>
    </aside>

    <section class="home-main flex min-w-0 flex-1 flex-col">
      <div
        class="home-chat-wrap min-h-0 flex-1 overflow-hidden px-[20px] py-[20px]"
      >
        <div class="home-chat-inner h-full min-w-0">
          <ChatPanel
            :session-id="store.currentSessionId"
            :messages="store.messages"
            :dynamic-form="store.dynamicForm"
            :loading="store.loading"
            :status-text="store.statusText"
            :codegen-progress-percent="store.codegenProgressPercent"
            :codegen-progress-detail="store.codegenProgressDetail"
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
    <RegisterDialog />
  </main>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import ChatPanel from "./components/chat/ChatPanel.vue";
import PreviewPanel from "./components/preview/PreviewPanel.vue";
import type { SessionItem } from "../../types";
import { useAuthStore } from "../../stores/auth";
import { useChatStore } from "../../stores/chat";
import RegisterDialog from "../Auth/RegisterDialog.vue";
import { openRegisterDialog } from "../Auth/registerDialog";
import { Login } from "../../components/Modal";

const store = useChatStore();
const auth = useAuthStore();
const previewRef = ref<InstanceType<typeof PreviewPanel> | null>(null);
const previewVisible = ref(false);
const pendingPreview = ref(false);

onMounted(async () => {
  window.addEventListener("auth:changed", handleAuthChanged);
  await bootstrapSessions();
});

onUnmounted(() => {
  window.removeEventListener("auth:changed", handleAuthChanged);
});

const onLogin = () => {
  Login()
    .then((res) => {
      console.log(res);
    })
    .catch(console.log);
};

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
const userInitial = computed(() => {
  const name = auth.user?.displayName || auth.user?.email || "U";
  return name.trim().slice(0, 1).toUpperCase();
});
const currentSessionTitle = computed(() => {
  const firstUserMessage = store.messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0,
  );
  if (firstUserMessage) {
    return firstUserMessage.content.split("\n")[0].trim();
  }
  return store.currentSession?.name || "新对话";
});

async function bootstrapSessions() {
  try {
    await store.refreshSessions();
    if (!store.currentSessionId) {
      await store.createNewSession("默认会话");
    }
  } catch (error) {
    if (error instanceof Error) {
      store.statusText = error.message;
    }
  }
}

function handleAuthChanged() {
  auth.syncFromStorage();
  if (auth.isLoggedIn) {
    void bootstrapSessions();
  }
}

function displaySessionTitle(session: SessionItem): string {
  if (session.id === store.currentSessionId) {
    return currentSessionTitle.value;
  }
  const n = session.name?.trim();
  return n || "新游戏项目";
}

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

async function handleLogout() {
  await auth.logout();
  store.resetConversation();
  store.sessions = [];
  store.currentSessionId = "";
  ElMessage.success("已退出登录");
}

function togglePreviewPanel() {
  previewVisible.value = !previewVisible.value;
  if (previewVisible.value) {
    pendingPreview.value = false;
  }
}
</script>
