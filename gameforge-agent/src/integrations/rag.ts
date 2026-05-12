import { access } from "node:fs/promises";
import path from "node:path";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { config } from "../config.js";
import { createEmbeddingModel } from "./embeddings.js";
import { rebuildVectorIndex } from "../services/ingest.js";

let storePromise: Promise<HNSWLib> | null = null;

/** 确保向量索引文件存在；缺失时触发一次强制重建。 */
async function ensureIndexExists(): Promise<void> {
  try {
    await access(path.resolve(config.ragRoot, "args.json"));
  } catch {
    await rebuildVectorIndex(true);
  }
}

/** 启动时预热 RAG 索引，尽量减少首个请求延迟。 */
export async function warmupRagIndex(): Promise<void> {
  await rebuildVectorIndex(false);
  await ensureIndexExists();
}

/** 懒加载向量存储实例，并在进程内复用。 */
async function getStore(): Promise<HNSWLib> {
  if (!storePromise) {
    storePromise = (async () => {
      await ensureIndexExists();
      return HNSWLib.load(config.ragRoot, createEmbeddingModel());
    })();
  }
  return storePromise;
}

/**
 * 基于查询语句检索相关知识片段，并拼接为模型可直接消费的上下文文本。
 */
export async function retrieveContext(query: string, topK = config.ragTopK): Promise<string> {
  const store = await getStore();
  const docs = await store.similaritySearch(query, topK);
  if (docs.length === 0) {
    return "";
  }
  return docs
    .map((doc, index) => {
      const source = String(doc.metadata?.source ?? "unknown");
      return `# 参考片段 ${index + 1}\n来源: ${source}\n${doc.pageContent}`;
    })
    .join("\n\n");
}
