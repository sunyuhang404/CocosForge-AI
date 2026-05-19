<template>
  <aside
    class="home-aside flex h-full w-[268px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white"
  >
    <div class="home-aside-actions border-b border-[#e5e7eb] px-3 py-3">
      <button
        class="home-new-session-button flex w-full items-center justify-between rounded-xl border border-[#d9deea] bg-white px-3 py-2 text-left text-[#2552d9] transition hover:bg-white"
        @click="emit('createSession')"
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
          v-for="session in props.sessions"
          :key="session.id"
          class="home-session-item w-full rounded-xl border px-3 py-2 text-left transition"
          :class="
            session.id === props.currentSessionId
              ? 'home-session-item--active border-[#e8eaef] bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
              : 'home-session-item--inactive border-transparent bg-transparent text-[#374151] hover:border-[#e8eaef] hover:bg-white'
          "
          @click="emit('switchSession', session.id)"
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
        v-if="props.user"
        class="home-account-button flex w-full items-center gap-2 rounded-xl bg-white px-2 py-2 text-left hover:bg-white"
        @click="emit('logout')"
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
            {{ props.user.displayName || props.user.email }}
          </div>
          <div class="home-account-role truncate text-xs text-[#9ca3af]">
            点击退出登录
          </div>
        </div>
      </button>
      <div v-else class="home-auth-actions grid grid-cols-2 gap-2">
        <button
          class="home-login-button rounded-xl border border-[#d9deea] px-3 py-2 text-sm font-semibold text-[#2552d9] transition hover:bg-[#f7f9ff]"
          @click="emit('login')"
        >
          登录
        </button>
        <button
          class="home-register-button rounded-xl bg-[#2552d9] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1f46bb]"
          @click="emit('register')"
        >
          注册
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UserInfo } from "@/api/authSession";
import type { SessionItem } from "@/types";

const props = defineProps<{
  sessions: SessionItem[];
  currentSessionId: string;
  currentSessionTitle: string;
  user: UserInfo | null;
}>();

const emit = defineEmits<{
  createSession: [];
  switchSession: [id: string];
  login: [];
  register: [];
  logout: [];
}>();

const userInitial = computed(() => {
  const name = props.user?.displayName || props.user?.email || "U";
  return name.trim().slice(0, 1).toUpperCase();
});

function displaySessionTitle(session: SessionItem): string {
  if (session.id === props.currentSessionId) {
    return props.currentSessionTitle;
  }
  const name = session.name?.trim();
  return name || "新游戏项目";
}
</script>
