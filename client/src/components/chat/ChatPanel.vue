<template>
  <section class="mx-auto flex h-full min-h-0 w-full max-w-[800px] flex-col px-0">
    <div class="mb-3 shrink-0 flex items-center justify-between">
      <span class="text-sm font-semibold text-[#111827]">消息</span>
      <span class="text-xs text-[#9ca3af]">共 {{ messageCount }} 条</span>
    </div>

    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3 pr-1">
      <div
        v-for="(message, index) in props.messages"
        :key="index"
        class="flex"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          :class="
            message.role === 'user'
              ? 'bg-[#e9efff] text-[#1e3a8a]'
              : 'border border-[#e5e7eb] bg-white text-[#111827]'
          "
        >
          <div
            class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]"
          >
            {{ message.role === "user" ? "你" : "助手" }}
          </div>
          <pre class="m-0 whitespace-pre-wrap font-sans">{{ message.content }}</pre>
        </div>
      </div>

      <DynamicForm
        v-if="props.dynamicForm"
        :form="props.dynamicForm"
        :loading="props.loading"
        @submit="(payload) => emit('submitForm', payload)"
      />
    </div>

    <div class="mt-3 shrink-0">
      <div class="doubao-composer">
        <el-input
          v-model="input"
          class="doubao-input"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="发消息..."
          @keydown.ctrl.enter.prevent="onSend"
        />
        <div class="doubao-tools">
          <button class="tool-icon" type="button" aria-label="更多输入">
            +
          </button>
          <button
            class="tool-btn"
            type="button"
            @click="emit('togglePreview')"
          >
            预览{{ props.previewVisible ? "收起" : "展开" }}
            <span v-if="props.pendingPreview" class="tool-badge"> 新 </span>
          </button>
          <button
            class="tool-btn"
            type="button"
            @click="emit('resetConversation')"
          >
            清空
          </button>
          <button class="tool-btn" type="button">更多</button>
          <button
            class="send-circle"
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
import { computed, ref } from "vue";
import type { MessageItem, DynamicFormSchema } from "../../types";
import DynamicForm from "./DynamicForm.vue";

const props = defineProps<{
  messages: MessageItem[];
  dynamicForm: DynamicFormSchema | null;
  loading: boolean;
  previewVisible: boolean;
  pendingPreview: boolean;
}>();

const emit = defineEmits<{
  sendMessage: [message: string];
  submitForm: [payload: Record<string, string | number>];
  resetConversation: [];
  togglePreview: [];
}>();

const input = ref("");
const messageCount = computed(() => props.messages.length);

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
</style>
