<template>
  <main class="gameforge-app flex h-screen w-screen flex-col">
    <header
      class="gameforge-app--header z-20 h-[64px] shrink-0 border-b border-[#e8ebf2] bg-white/95 backdrop-blur"
    >
      <div class="gameforge-app--header-inner flex h-full w-full items-center">
        <div
          class="gameforge-app--logo flex h-full w-[268px] shrink-0 items-center border-r border-[#e5e7eb] px-3"
        >
          <Logo />
        </div>
        <div class="gameforge-app--title-wrap flex min-w-0 flex-1 items-center justify-center px-[20px]">
          <div class="gameforge-app--title max-w-[70%] truncate text-center text-sm font-semibold text-[#111827]">
            {{ currentSessionTitle }}
          </div>
        </div>
      </div>
    </header>

    <section class="gameforge-app--content flex min-h-0 flex-1 overflow-hidden bg-white">
      <MenuList
        :sessions="store.sessions"
        :current-session-id="store.currentSessionId"
        :current-session-title="currentSessionTitle"
        :user="auth.user"
        @create-session="handleCreateSession"
        @switch-session="handleSwitchSession"
        @logout="handleLogout"
      />
      <RouterView />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, onUnmounted, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import Logo from "@/components/Logo.vue";
import MenuList from "@/components/MenuList.vue";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";

const store = useChatStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const currentSessionTitle = computed(() => {
  const firstUserMessage = store.messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0,
  );
  if (firstUserMessage) {
    return firstUserMessage.content.split("\n")[0].trim();
  }
  return store.currentSession?.name || "新对话";
});

onMounted(async () => {
  window.addEventListener("auth:changed", handleAuthChanged);
  await bootstrapSessions();
});

onUnmounted(() => {
  window.removeEventListener("auth:changed", handleAuthChanged);
});

watch(
  () => route.params.sessionId,
  (sessionId) => {
    const nextSessionId = normalizeSessionId(sessionId);
    if (!nextSessionId || nextSessionId === store.currentSessionId) {
      return;
    }
    if (!hasSession(nextSessionId)) {
      return;
    }
    void store.switchSession(nextSessionId);
  },
);

async function bootstrapSessions() {
  try {
    const routeSessionId = normalizeSessionId(route.params.sessionId);
    await store.refreshSessions(routeSessionId);
    if (store.sessions.length === 0) {
      await replaceSessionRoute("");
      return;
    }

    if (routeSessionId && !hasSession(routeSessionId)) {
      await replaceSessionRoute(store.currentSessionId);
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

async function handleCreateSession() {
  await store.createNewSession();
  await pushSessionRoute(store.currentSessionId);
}

async function handleSwitchSession(id: string) {
  await store.switchSession(id);
  await pushSessionRoute(id);
}

async function handleLogout() {
  await auth.logout();
  store.sessions = [];
  store.clearCurrentSession();
  await replaceSessionRoute("");
  ElMessage.success("已退出登录");
}

function normalizeSessionId(
  sessionId: string | string[] | undefined,
): string {
  if (Array.isArray(sessionId)) {
    return sessionId[0] ?? "";
  }
  return sessionId ?? "";
}

async function pushSessionRoute(sessionId: string) {
  if (!sessionId || normalizeSessionId(route.params.sessionId) === sessionId) {
    return;
  }
  await router.push({
    name: "home",
    params: {
      sessionId,
    },
  });
}

async function replaceSessionRoute(sessionId: string) {
  if (normalizeSessionId(route.params.sessionId) === sessionId) {
    return;
  }
  await router.replace({
    name: "home",
    params: sessionId ? { sessionId } : {},
  });
}

function hasSession(sessionId: string): boolean {
  return store.sessions.some((session) => session.id === sessionId);
}
</script>
