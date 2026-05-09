import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { DynamicFormSchema, MessageItem, SessionItem } from "../types";
import { createSession, fetchSessionMessages, fetchSessions } from "../services/api";
import { streamChat } from "../services/sse";

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<SessionItem[]>([]);
  const currentSessionId = ref<string>("");
  const messages = ref<MessageItem[]>([]);
  const planningText = ref("");
  const dynamicForm = ref<DynamicFormSchema | null>(null);
  const previewUrl = ref("");
  const statusText = ref("就绪");
  const loading = ref(false);

  const currentSession = computed(() =>
    sessions.value.find((item) => item.id === currentSessionId.value) ?? null
  );

  async function refreshSessions() {
    sessions.value = await fetchSessions();
    if (!currentSessionId.value && sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id;
      await loadMessages(currentSessionId.value);
    }
  }

  async function createNewSession(name?: string) {
    const session = await createSession(name);
    sessions.value = [session, ...sessions.value];
    currentSessionId.value = session.id;
    messages.value = [];
    planningText.value = "";
    previewUrl.value = "";
  }

  async function switchSession(sessionId: string) {
    currentSessionId.value = sessionId;
    planningText.value = "";
    dynamicForm.value = null;
    await loadMessages(sessionId);
  }

  async function loadMessages(sessionId: string) {
    messages.value = await fetchSessionMessages(sessionId);
  }

  async function sendMessage(message: string, formAnswers?: Record<string, string | number>) {
    if (!currentSessionId.value || loading.value) {
      return;
    }
    loading.value = true;
    statusText.value = "处理中";
    messages.value.push({ role: "user", content: message });
    let assistantBuffer = "";
    let assistantMessageIndex = -1;

    await streamChat(
      { sessionId: currentSessionId.value, message, formAnswers },
      {
        onEvent: (event, payload) => {
          if (event === "planning_chunk") {
            const chunk = (payload as { chunk?: string }).chunk ?? "";
            assistantBuffer += chunk;
            planningText.value += chunk;
            if (assistantMessageIndex === -1) {
              messages.value.push({ role: "assistant", content: "" });
              assistantMessageIndex = messages.value.length - 1;
            }
            messages.value[assistantMessageIndex].content = assistantBuffer;
          }
          if (event === "question_form") {
            dynamicForm.value = payload as DynamicFormSchema;
            statusText.value = "等待补充信息";
          }
          if (event === "preview_ready") {
            previewUrl.value = (payload as { previewUrl: string }).previewUrl;
            statusText.value = "预览可用";
          }
          if (event === "codegen_progress") {
            const p = payload as { stage?: string; percent?: number };
            statusText.value = `${p.stage ?? "running"} ${p.percent ?? 0}%`;
          }
          if (event === "error") {
            statusText.value = (payload as { message?: string }).message ?? "发生错误";
          }
        },
        onError: (messageText) => {
          statusText.value = messageText;
        }
      }
    );

    if (assistantBuffer.trim() && assistantMessageIndex === -1) {
      messages.value.push({ role: "assistant", content: assistantBuffer });
    }
    loading.value = false;
    if (statusText.value === "处理中") {
      statusText.value = "完成";
    }
  }

  function resetConversation() {
    messages.value = [];
    planningText.value = "";
    dynamicForm.value = null;
    previewUrl.value = "";
    statusText.value = "已重置";
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    planningText,
    dynamicForm,
    previewUrl,
    statusText,
    loading,
    refreshSessions,
    createNewSession,
    switchSession,
    sendMessage,
    resetConversation
  };
});
