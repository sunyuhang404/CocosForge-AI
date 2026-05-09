import path from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { config } from "../config.js";
import type { ChatRequestBody, SseEventPayloadMap } from "../types.js";
import { evaluateGuardrails } from "./chains.js";
import { plannerSystemPrompt } from "./prompts.js";
import { retrieveContext } from "../integrations/rag.js";
import { generateGameCode } from "../services/codegen.js";
import { getSessionFolders } from "../lib/storage.js";
import { getNextAssetVersion, saveAsset, saveMessage, setSessionStatus } from "../services/session.js";
import { writePlanningDoc, writePreviewBuild, writeSourceCode } from "../services/preview.js";

type Emitter = <K extends keyof SseEventPayloadMap>(event: K, payload: SseEventPayloadMap[K]) => void;

const openai = createOpenAI({
  apiKey: config.qwenApiKey,
  baseURL: config.qwenBaseUrl
});

/**
 * 执行聊天请求的完整编排流程。
 * 包含护栏校验、策划文档生成、代码生成、预览构建与资产落库，并通过 SSE 持续回传进度。
 */
export async function runChatWorkflow(request: ChatRequestBody, emit: Emitter): Promise<void> {
  // 将动态表单补充信息并入用户输入，确保后续模型判断与生成使用同一份上下文。
  const userPayload =
    request.formAnswers && Object.keys(request.formAnswers).length > 0
      ? `${request.message}\n\n补充信息:\n${JSON.stringify(request.formAnswers, null, 2)}`
      : request.message;

  // 第一步：执行语义范围与信息充分性护栏。
  const guardrail = await evaluateGuardrails(userPayload);
  emit("guardrail_result", { status: guardrail.status, detail: "guardrails_checked" });

  // 无论是否通过护栏，都先记录用户消息用于会话追踪。
  await saveMessage({
    sessionId: request.sessionId,
    role: "user",
    content: userPayload,
    isGameRelated: guardrail.status !== "blocked"
  });

  if (guardrail.status === "blocked") {
    // 被拦截时直接返回解释文案，不进入后续生成阶段。
    await saveMessage({
      sessionId: request.sessionId,
      role: "assistant",
      content: guardrail.reply,
      isGameRelated: false
    });
    emit("planning_chunk", { chunk: guardrail.reply });
    return;
  }

  if (guardrail.status === "needs_more_info") {
    // 信息不足时下发动态表单，等待用户补充后再继续流程。
    emit("question_form", guardrail.form);
    await saveMessage({
      sessionId: request.sessionId,
      role: "assistant",
      content: JSON.stringify(guardrail.form, null, 2),
      isGameRelated: true
    });
    return;
  }

  await setSessionStatus(request.sessionId, "PLANNING");
  emit("codegen_progress", { stage: "planning", percent: 10, detail: "开始生成策划案" });

  // 结合 RAG 检索上下文生成可流式输出的策划案。
  const ragContext = await retrieveContext(userPayload).catch(() => "");
  const planningStream = streamText({
    model: openai(config.qwenModel),
    system: plannerSystemPrompt,
    prompt: `用户需求：${userPayload}\n\n参考资料：\n${ragContext || "无"}`
  });

  let planningMarkdown = "";
  // 逐块推送策划文本，前端可实时渲染。
  for await (const chunk of planningStream.textStream) {
    planningMarkdown += chunk;
    emit("planning_chunk", { chunk });
  }
  await saveMessage({
    sessionId: request.sessionId,
    role: "assistant",
    content: planningMarkdown,
    isGameRelated: true
  });

  const folders = getSessionFolders(request.sessionId);
  const planVersion = await getNextAssetVersion(request.sessionId, "PLAN");
  const planFilePath = await writePlanningDoc(folders.planDir, planningMarkdown, planVersion);
  await saveAsset({
    sessionId: request.sessionId,
    type: "PLAN",
    fileName: path.basename(planFilePath),
    filePath: planFilePath,
    content: planningMarkdown,
    version: planVersion
  });

  emit("codegen_progress", { stage: "codegen", percent: 60, detail: "开始生成 TypeScript 代码" });
  await setSessionStatus(request.sessionId, "DEVELOPING");
  // 基于策划案生成业务代码并落盘归档。
  const code = await generateGameCode({
    userMessage: userPayload,
    planningMarkdown
  });

  const codeVersion = await getNextAssetVersion(request.sessionId, "CODE");
  const codeFilePath = await writeSourceCode(folders.srcDir, code, codeVersion);
  await saveAsset({
    sessionId: request.sessionId,
    type: "CODE",
    fileName: path.basename(codeFilePath),
    filePath: codeFilePath,
    content: code,
    version: codeVersion
  });

  emit("codegen_progress", { stage: "build", percent: 85, detail: "生成预览页面" });
  // 生成预览产物并保存构建资产版本。
  const buildVersion = await getNextAssetVersion(request.sessionId, "BUILD");
  const buildPath = await writePreviewBuild(folders, code, buildVersion);
  await saveAsset({
    sessionId: request.sessionId,
    type: "BUILD",
    fileName: path.basename(buildPath),
    filePath: buildPath,
    version: buildVersion
  });

  await setSessionStatus(request.sessionId, "DONE");
  emit("codegen_progress", { stage: "done", percent: 100, detail: "完成" });
  emit("preview_ready", {
    previewUrl: `${config.previewBaseUrl}/${request.sessionId}/index.html?v=${Date.now()}`,
    version: buildVersion
  });
}
