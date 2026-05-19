import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { createSession, fetchSessionMessages, fetchSessions } from "@/api/api";
import { streamChat } from "@/api/sse";
import { codegenProgressLabel } from "@/lib/codegenLabels";
import type { DynamicFormSchema, MessageItem, SessionItem } from "@/types";

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<SessionItem[]>([]);
  const currentSessionId = ref<string>("");
  const messages = ref<MessageItem[]>([]);
  const planningText = ref("");
  const dynamicForm = ref<DynamicFormSchema | null>(null);
  const previewUrl = ref("");
  const statusText = ref("就绪");
  /** 后端 `codegen_progress.percent`，null 表示本轮尚未收到进度事件 */
  const codegenProgressPercent = ref<number | null>(null);
  /** 当前阶段说明（优先使用服务端 `detail`） */
  const codegenProgressDetail = ref("");
  const loading = ref(false);

  const currentSession = computed(() =>
    sessions.value.find((item) => item.id === currentSessionId.value) ?? null
  );

  async function refreshSessions(preferredSessionId = "") {
    sessions.value = await fetchSessions();
    if (sessions.value.length === 0) {
      clearCurrentSession();
      return;
    }

    const hasPreferredSession = sessions.value.some(
      (item) => item.id === preferredSessionId,
    );
    const hasCurrentSession = sessions.value.some(
      (item) => item.id === currentSessionId.value,
    );
    const nextSessionId = hasPreferredSession
      ? preferredSessionId
      : hasCurrentSession
      ? currentSessionId.value
      : sessions.value[0].id;

    if (nextSessionId !== currentSessionId.value) {
      currentSessionId.value = nextSessionId;
    }
    await loadMessages(nextSessionId);
  }

  async function createNewSession(name?: string) {
    const session = await createSession(name);
    sessions.value = [session, ...sessions.value];
    currentSessionId.value = session.id;
    messages.value = [];
    planningText.value = "";
    previewUrl.value = "";
    codegenProgressPercent.value = null;
    codegenProgressDetail.value = "";
  }

  async function switchSession(sessionId: string) {
    currentSessionId.value = sessionId;
    messages.value = [];
    planningText.value = "";
    dynamicForm.value = null;
    codegenProgressPercent.value = null;
    codegenProgressDetail.value = "";
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
    codegenProgressPercent.value = null;
    codegenProgressDetail.value = "";
    messages.value.push({ role: "user", content: message });
    let assistantBuffer = "";
    let assistantMessageIndex = -1;

    await streamChat(
      { sessionId: currentSessionId.value, message, formAnswers },
      {
        onEvent: (event, payload) => {
          if (event === "session_renamed") {
            const { name } = payload as { name?: string };
            if (name && currentSessionId.value) {
              sessions.value = sessions.value.map((s) =>
                s.id === currentSessionId.value ? { ...s, name } : s
              );
            }
          }
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
            const p = payload as { stage?: string; percent?: number; detail?: string };
            const pct = typeof p.percent === "number" ? Math.min(100, Math.max(0, p.percent)) : null;
            if (pct !== null) {
              codegenProgressPercent.value = pct;
            }
            const label = codegenProgressLabel(p.stage, p.detail);
            codegenProgressDetail.value = label;
            statusText.value = pct !== null ? `${label} · ${pct}%` : label;
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
    codegenProgressPercent.value = null;
    codegenProgressDetail.value = "";
    if (statusText.value === "处理中") {
      statusText.value = "完成";
    }
  }

  function resetConversation() {
    messages.value = [];
    planningText.value = "";
    dynamicForm.value = null;
    previewUrl.value = "";
    codegenProgressPercent.value = null;
    codegenProgressDetail.value = "";
    statusText.value = "已重置";
  }

  function clearCurrentSession() {
    currentSessionId.value = "";
    messages.value = [];
    planningText.value = "";
    dynamicForm.value = null;
    previewUrl.value = "";
    codegenProgressPercent.value = null;
    codegenProgressDetail.value = "";
    loading.value = false;
    statusText.value = "就绪";
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
    codegenProgressPercent,
    codegenProgressDetail,
    loading,
    refreshSessions,
    createNewSession,
    switchSession,
    sendMessage,
    resetConversation,
    clearCurrentSession
  };
});
