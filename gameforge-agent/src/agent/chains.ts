import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { DynamicFormSchema, GuardrailResult } from "../types.js";
import { config } from "../config.js";
import { feasibilityPrompt, semanticFilterPrompt } from "./prompts.js";
import { retrieveContext } from "../integrations/rag.js";

const openai = createOpenAI({
  apiKey: config.qwenApiKey,
  baseURL: config.qwenBaseUrl
});

/**
 * 安全解析模型返回的 JSON 字符串。
 * 解析失败时回退到调用方提供的默认值，避免链路因格式问题中断。
 */
function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * 判断用户输入是否属于游戏开发语义范围。
 * 返回模型结构化结果，用于决定是否阻断后续流程。
 */
export async function runSemanticFilter(userInput: string): Promise<{
  isGameRelated: boolean;
  reason: string;
  reply: string;
}> {
  const { text } = await generateText({
    model: openai(config.qwenModel),
    prompt: `${semanticFilterPrompt}\n\n用户输入：${userInput}`
  });
  return safeParseJson(text, {
    isGameRelated: true,
    reason: "fallback",
    reply: ""
  });
}

/**
 * 检查需求是否达到可执行的最小信息集。
 * 当信息不足时返回缺失项与追问字段，供前端渲染表单。
 */
export async function runFeasibilityCheck(userInput: string): Promise<{
  enough: boolean;
  summary: string;
  missingFields: string[];
  questions: Array<{ key: string; label: string; type: "text" | "number" | "select"; required: boolean }>;
}> {
  const ragContext = await retrieveContext(userInput).catch(() => "");
  const { text } = await generateText({
    model: openai(config.qwenModel),
    prompt: `${feasibilityPrompt}\n\n参考资料：\n${ragContext || "无"}\n\n用户输入：${userInput}`
  });
  return safeParseJson(text, {
    enough: true,
    summary: "可开始策划。",
    missingFields: [],
    questions: []
  });
}

/**
 * 汇总护栏链路结果并给出统一决策。
 * 按 blocked / needs_more_info / pass 三态驱动后续编排流程。
 */
export async function evaluateGuardrails(userInput: string): Promise<GuardrailResult> {
  const semantic = await runSemanticFilter(userInput);
  if (!semantic.isGameRelated) {
    return {
      status: "blocked",
      reason: semantic.reason,
      reply: semantic.reply || "这个问题暂时超出游戏开发范围，我们继续聊游戏设计吧。"
    };
  }
  const feasibility = await runFeasibilityCheck(userInput);
  if (!feasibility.enough) {
    // 将可行性检查返回的问题列表转换为前端可直接消费的动态表单结构。
    const form: DynamicFormSchema = {
      title: "补充关键信息",
      description: feasibility.summary || "还缺少一些关键信息，请补充后继续。",
      fields: feasibility.questions.map((question) => ({
        key: question.key,
        label: question.label,
        type: question.type,
        required: question.required
      }))
    };
    return {
      status: "needs_more_info",
      missingFields: feasibility.missingFields,
      form
    };
  }
  return {
    status: "pass",
    summary: feasibility.summary || "需求足够，进入策划与代码生成阶段。",
    isGameRelated: true
  };
}
