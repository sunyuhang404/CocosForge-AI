import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "../config.js";
import { codeGenPrompt, codeReviewPrompt } from "../agent/prompts.js";
import { retrieveContext } from "../integrations/rag.js";
import { sanitizeGeneratedGameCode } from "../lib/codeHygiene.js";

const openai = createOpenAI({
  apiKey: config.qwenApiKey,
  baseURL: config.qwenBaseUrl
});

const MAX_USER_SNIPPET = 4000;
const MAX_PLAN_SNIPPET = 24000;
const MAX_CODE_SNIPPET = 120000;

type CodeReviewJson = {
  ok: boolean;
  issues: string[];
  code: string;
};

function parseCodeReviewResponse(text: string): CodeReviewJson | null {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidates.push(fence[1].trim());

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(trimmed.slice(start, end + 1));

  for (const raw of candidates) {
    try {
      const o = JSON.parse(raw) as CodeReviewJson;
      if (
        typeof o.ok === "boolean" &&
        Array.isArray(o.issues) &&
        o.issues.every((x) => typeof x === "string") &&
        typeof o.code === "string"
      ) {
        return o;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function clipPlanning(planningMarkdown: string): string {
  if (planningMarkdown.length <= MAX_PLAN_SNIPPET) return planningMarkdown;
  return `${planningMarkdown.slice(0, MAX_PLAN_SNIPPET)}\n\n…（策划案已截断用于校验）`;
}

function clipUser(userMessage: string): string {
  if (userMessage.length <= MAX_USER_SNIPPET) return userMessage;
  return `${userMessage.slice(0, MAX_USER_SNIPPET)}\n…`;
}

function clipCode(code: string): string {
  if (code.length <= MAX_CODE_SNIPPET) return code;
  return `${code.slice(0, MAX_CODE_SNIPPET)}\n\n…（脚本已截断用于校验，请勿删减前半已实现逻辑）`;
}

/**
 * 结合用户需求、策划案与检索上下文生成 TypeScript 游戏代码。
 */
export async function generateGameCode(input: {
  userMessage: string;
  planningMarkdown: string;
  priorIssues?: string[];
}): Promise<string> {
  const ragContext = await retrieveContext(input.userMessage).catch(() => "");
  const issuesBlock =
    input.priorIssues && input.priorIssues.length > 0
      ? `\n\n上一次自动校验未通过，请修正后再输出完整代码（仍是单一脚本文件）：\n${input.priorIssues.map((i) => `- ${i}`).join("\n")}`
      : "";
  const { text } = await generateText({
    model: openai(config.qwenModel),
    prompt: `${codeGenPrompt}${issuesBlock}\n\n参考资料:\n${ragContext || "无"}\n\n用户需求:\n${input.userMessage}\n\n策划案:\n${input.planningMarkdown}`
  });
  return text;
}

export type GameCodeReviewOutcome = {
  ok: boolean;
  issues: string[];
  /** 供写入源码与预览的最终脚本（已结合校验结果选用）。 */
  code: string;
  parseFailed: boolean;
};

/**
 * 调用模型校验并在必要时返回修补后的完整脚本；解析失败时会重试一次.prompt。
 */
export async function reviewAndRepairGameCode(input: {
  userMessage: string;
  planningMarkdown: string;
  code: string;
}): Promise<GameCodeReviewOutcome> {
  const body = `\n\n用户需求摘要:\n${clipUser(input.userMessage)}\n\n策划案:\n${clipPlanning(input.planningMarkdown)}\n\n当前脚本:\n${clipCode(input.code)}`;

  const runOnce = async (strictHint: string) => {
    const { text } = await generateText({
      model: openai(config.qwenModel),
      prompt: `${codeReviewPrompt}${strictHint}${body}`
    });
    return text;
  };

  let text = await runOnce("");
  let parsed = parseCodeReviewResponse(text);
  if (!parsed) {
    text = await runOnce("\n\n务必只输出一个 JSON 对象字符串，不要用 markdown 代码围栏包裹 JSON。");
    parsed = parseCodeReviewResponse(text);
  }

  if (!parsed) {
    return {
      ok: false,
      issues: ["模型校验响应无法解析为 JSON"],
      code: input.code,
      parseFailed: true
    };
  }

  const issues = parsed.issues;
  const returnedCode = sanitizeGeneratedGameCode(parsed.code);
  const ok = parsed.ok;

  if (ok) {
    return {
      ok: true,
      issues,
      code: returnedCode.trim() ? returnedCode : input.code,
      parseFailed: false
    };
  }

  return {
    ok: false,
    issues,
    code: returnedCode.trim() ? returnedCode : "",
    parseFailed: false
  };
}

/** 供编排使用：剥离围栏后的脚本再交给校验与落盘。 */
export { sanitizeGeneratedGameCode };
