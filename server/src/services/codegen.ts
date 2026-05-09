import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "../config.js";
import { codeGenPrompt } from "../agent/prompts.js";
import { retrieveContext } from "../integrations/rag.js";

const openai = createOpenAI({
  apiKey: config.qwenApiKey,
  baseURL: config.qwenBaseUrl
});

/**
 * 结合用户需求、策划案与检索上下文生成 TypeScript 游戏代码。
 */
export async function generateGameCode(input: {
  userMessage: string;
  planningMarkdown: string;
}): Promise<string> {
  // RAG 检索失败时回退为空上下文，保持代码生成流程可继续。
  const ragContext = await retrieveContext(input.userMessage).catch(() => "");
  const { text } = await generateText({
    model: openai(config.qwenModel),
    prompt: `${codeGenPrompt}\n\n参考资料:\n${ragContext || "无"}\n\n用户需求:\n${input.userMessage}\n\n策划案:\n${input.planningMarkdown}`
  });
  return text;
}
