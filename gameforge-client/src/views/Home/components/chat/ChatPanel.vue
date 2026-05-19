<template>
  <section class="chat-panel mx-auto flex h-full min-h-0 w-full max-w-[800px] flex-col px-0">
    <div class="chat-panel-header mb-3 shrink-0 flex items-center justify-between">
      <span class="chat-panel-title text-sm font-semibold text-[#111827]">消息</span>
      <span class="chat-panel-count text-xs text-[#9ca3af]">共 {{ messageCount }} 条</span>
    </div>

    <div
      ref="messagesContainerRef"
      class="chat-panel-messages min-h-0 flex-1 space-y-3 overflow-y-auto pb-3 pr-1"
      @scroll="onMessagesScroll"
    >
      <div
        v-for="(message, index) in props.messages"
        :key="index"
        class="chat-message-row flex"
        :class="message.role === 'user' ? 'chat-message-row--user justify-end' : 'chat-message-row--assistant justify-start'"
      >
        <div
          class="chat-message-bubble max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          :class="
            message.role === 'user'
              ? 'chat-message-bubble--user bg-[#e9efff] text-[#1e3a8a]'
              : 'chat-message-bubble--assistant border border-[#e5e7eb] bg-white text-[#111827]'
          "
        >
          <div
            class="chat-message-role mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]"
          >
            {{ message.role === "user" ? "你" : "助手" }}
          </div>
          <pre
            v-if="message.role === 'user'"
            class="chat-message-text m-0 whitespace-pre-wrap font-sans"
          >{{ message.content }}</pre>
          <div
            v-else
            class="chat-message-markdown markdown-content"
            v-html="renderAssistantMarkdown(message.content)"
          />
        </div>
      </div>

      <DynamicForm
        v-if="props.dynamicForm"
        :form="props.dynamicForm"
        :loading="props.loading"
        @submit="(payload) => emit('submitForm', payload)"
      />
    </div>

    <div class="chat-panel-composer-wrap mt-3 shrink-0">
      <div class="chat-panel-composer doubao-composer">
        <el-input
          v-model="input"
          class="chat-panel-input doubao-input"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="发消息..."
          @keydown.ctrl.enter.prevent="onSend"
        />
        <div class="chat-panel-tools doubao-tools">
          <button class="chat-panel-tool-icon tool-icon" type="button" aria-label="更多输入">
            +
          </button>
          <button
            class="chat-panel-preview-button tool-btn"
            type="button"
            @click="emit('togglePreview')"
          >
            预览{{ props.previewVisible ? "收起" : "展开" }}
            <span v-if="props.pendingPreview" class="chat-panel-tool-badge tool-badge"> 新 </span>
          </button>
          <button
            class="chat-panel-clear-button tool-btn"
            type="button"
            @click="emit('resetConversation')"
          >
            清空
          </button>
          <button class="chat-panel-more-button tool-btn" type="button">更多</button>
          <div
            v-if="props.loading"
            class="chat-panel-progress codegen-progress-inline"
          >
            <template v-if="props.codegenProgressPercent !== null">
              <el-progress
                :percentage="props.codegenProgressPercent"
                :stroke-width="6"
                striped
                striped-flow
                class="chat-panel-progress-bar codegen-progress-bar"
              />
              <span
                v-if="props.codegenProgressDetail"
                class="chat-panel-progress-meta codegen-progress-meta"
              >{{ props.codegenProgressDetail }}</span>
            </template>
            <span
              v-else
              class="chat-panel-status codegen-status-fallback"
            >{{ props.statusText }}</span>
          </div>
          <button
            class="chat-panel-send-button send-circle"
            type="button"
            :disabled="props.loading"
            @click="onSend"
          >
            {{ props.loading ? "…" : "↑" }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { MessageItem, DynamicFormSchema } from "../../../../types";
import { renderMarkdown } from "../../../../lib/markdown";
import DynamicForm from "./DynamicForm.vue";

const props = withDefaults(
  defineProps<{
    sessionId: string;
    messages: MessageItem[];
    dynamicForm: DynamicFormSchema | null;
    loading: boolean;
    /** 顶部栏移除后，在尚无 codegen 进度时用于工具条简短状态（如「处理中」） */
    statusText?: string;
    /** 与 SSE codegen_progress.percent 对应；null 表示本轮尚未收到进度 */
    codegenProgressPercent?: number | null;
    codegenProgressDetail?: string;
    previewVisible: boolean;
    pendingPreview: boolean;
  }>(),
  {
    codegenProgressPercent: null,
    codegenProgressDetail: "",
    statusText: ""
  }
);

const emit = defineEmits<{
  sendMessage: [message: string];
  submitForm: [payload: Record<string, string | number>];
  resetConversation: [];
  togglePreview: [];
}>();

const input = ref("");
const messageCount = computed(() => props.messages.length);
const messagesContainerRef = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);
const isProgrammaticScroll = ref(false);
const autoScrollThreshold = 24;

function getDistanceToBottom(element: HTMLElement): number {
  return element.scrollHeight - element.clientHeight - element.scrollTop;
}

function isNearBottom(element: HTMLElement): boolean {
  return getDistanceToBottom(element) <= autoScrollThreshold;
}

function onMessagesScroll() {
  if (isProgrammaticScroll.value) {
    return;
  }
  const element = messagesContainerRef.value;
  if (!element) {
    return;
  }
  shouldAutoScroll.value = isNearBottom(element);
}

async function scrollToBottom(force = false) {
  await nextTick();
  const element = messagesContainerRef.value;
  if (!element || (!force && !shouldAutoScroll.value)) {
    return;
  }

  isProgrammaticScroll.value = true;
  element.scrollTop = element.scrollHeight;
  shouldAutoScroll.value = true;
  requestAnimationFrame(() => {
    isProgrammaticScroll.value = false;
  });
}

watch(
  () => props.sessionId,
  (newId, oldId) => {
    if (oldId === undefined) {
      return;
    }
    if (newId === oldId) {
      return;
    }
    shouldAutoScroll.value = true;
    if (props.messages.length > 0) {
      void scrollToBottom(true);
    }
  },
  { flush: "post" },
);

watch(
  () => props.messages.length,
  (n, o) => {
    if (o !== undefined && o > 0 && n === 0) {
      shouldAutoScroll.value = true;
    }
  },
);

watch(
  () => props.messages.map((message) => `${message.role}:${message.content}`).join("\n"),
  () => {
    if (shouldAutoScroll.value) {
      void scrollToBottom();
    }
  }
);

watch(
  () => props.dynamicForm,
  () => {
    if (shouldAutoScroll.value) {
      void scrollToBottom();
    }
  }
);

watch(
  () => props.loading,
  (isLoading) => {
    if (!isLoading) {
      return;
    }
    const element = messagesContainerRef.value;
    shouldAutoScroll.value = element ? isNearBottom(element) : true;
    if (shouldAutoScroll.value) {
      void scrollToBottom(true);
    }
  }
);

onMounted(() => {
  void scrollToBottom(true);
});

function renderAssistantMarkdown(content: string): string {
  return renderMarkdown(content);
}

function onSend() {
  const text = input.value.trim();
  if (!text) {
    return;
  }
  emit("sendMessage", text);
  input.value = "";
}
</script>

<style scoped>
:deep(.doubao-input .el-textarea__inner) {
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 10px 12px 2px;
  min-height: 78px;
  line-height: 1.75;
  color: #0f172a;
  font-size: 16px;
}

:deep(.doubao-input .el-textarea__inner:focus) {
  box-shadow: none;
}

.doubao-composer {
  border-radius: 24px;
  border: 1.5px solid #bfd0ff;
  background: #ffffff;
  padding: 8px 10px 10px;
  box-shadow: 0 10px 24px rgba(79, 124, 255, 0.12);
}

.doubao-tools {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.codegen-progress-inline {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-left: 4px;
}

.codegen-progress-bar {
  flex: 1;
  min-width: 96px;
  max-width: 220px;
}

.codegen-progress-meta {
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #64748b;
  max-width: 160px;
}

.codegen-status-fallback {
  font-size: 12px;
  color: #64748b;
}

.tool-icon,
.tool-btn {
  border: none;
  background: transparent;
  color: #1f2937;
  height: 30px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 14px;
  cursor: pointer;
}

.tool-icon {
  width: 30px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
}

.tool-icon:hover,
.tool-btn:hover {
  background: #eef2ff;
}

.tool-badge {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #4f7cff;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 0 5px;
}

.send-circle {
  margin-left: auto;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: #eef1f7;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.send-circle:hover {
  background: #dbe4ff;
}

.send-circle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: #111827;
  word-break: break-word;
}

:deep(.markdown-content > *:first-child) {
  margin-top: 0;
}

:deep(.markdown-content > *:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content p) {
  margin: 0.5em 0;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3),
:deep(.markdown-content h4) {
  margin: 0.75em 0 0.4em;
  line-height: 1.35;
}

:deep(.markdown-content h1) {
  font-size: 1.35em;
}

:deep(.markdown-content h2) {
  font-size: 1.2em;
}

:deep(.markdown-content h3) {
  font-size: 1.08em;
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin: 0.5em 0;
  padding-left: 1.3em;
}

:deep(.markdown-content li) {
  margin: 0.2em 0;
}

:deep(.markdown-content a) {
  color: #2563eb;
  text-decoration: underline;
}

:deep(.markdown-content blockquote) {
  margin: 0.6em 0;
  padding-left: 0.8em;
  border-left: 3px solid #cbd5e1;
  color: #475569;
}

:deep(.markdown-content pre) {
  margin: 0.7em 0;
  padding: 0.75em 0.9em;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  overflow-x: auto;
}

:deep(.markdown-content code) {
  border-radius: 4px;
  background: #e5e7eb;
  padding: 0.1em 0.3em;
  font-size: 0.92em;
}

:deep(.markdown-content pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.95em;
}
</style>
