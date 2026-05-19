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

    <section class="gameforge-app--content min-h-0 flex-1">
      <HomeView />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Logo from "./components/Logo.vue";
import HomeView from "./views/Home/HomeView.vue";
import { useChatStore } from "./stores/chat";

const store = useChatStore();
const currentSessionTitle = computed(() => {
  const firstUserMessage = store.messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0,
  );
  if (firstUserMessage) {
    return firstUserMessage.content.split("\n")[0].trim();
  }
  return store.currentSession?.name || "新对话";
});
</script>
