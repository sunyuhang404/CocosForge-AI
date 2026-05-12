import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "../config.js";

/** 创建向量嵌入模型实例，供 RAG 索引与检索流程复用。 */
export function createEmbeddingModel(): OpenAIEmbeddings {
  if (!config.qwenApiKey) {
    throw new Error("QWEN_API_KEY 未配置，无法调用 text-embedding-v3。");
  }
  return new OpenAIEmbeddings({
    model: config.qwenEmbeddingModel,
    apiKey: config.qwenApiKey,
    configuration: {
      baseURL: config.qwenBaseUrl
    }
  });
}
