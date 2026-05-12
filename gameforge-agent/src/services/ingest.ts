import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { config } from "../config.js";
import { createEmbeddingModel } from "../integrations/embeddings.js";
import { loadKnowledgeSources } from "./sources.js";

type IngestMeta = {
  sourceHashes: Record<string, string>;
  updatedAt: string;
};

const metaPath = path.resolve(config.ragRoot, "meta.json");

/** 读取索引元信息；首次构建或损坏时回退为空元数据。 */
async function readMeta(): Promise<IngestMeta> {
  try {
    const text = await readFile(metaPath, "utf8");
    return JSON.parse(text) as IngestMeta;
  } catch {
    return { sourceHashes: {}, updatedAt: new Date(0).toISOString() };
  }
}

/** 将最新源文档哈希与更新时间写回元信息文件。 */
async function writeMeta(meta: IngestMeta): Promise<void> {
  await mkdir(config.ragRoot, { recursive: true });
  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
}

/** 对文档内容做哈希，用于判断知识源是否发生变化。 */
function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * 重建向量索引。
 * 默认仅在源文档变化时重建，force=true 时强制重建。
 */
export async function rebuildVectorIndex(force = false): Promise<{ changed: boolean; count: number }> {
  const sources = await loadKnowledgeSources();
  const currentHashes = Object.fromEntries(sources.map((s) => [s.id, hashText(s.content)]));
  const previousMeta = await readMeta();
  const changed =
    force ||
    Object.keys(currentHashes).length !== Object.keys(previousMeta.sourceHashes).length ||
    Object.entries(currentHashes).some(([key, value]) => previousMeta.sourceHashes[key] !== value);

  if (!changed) {
    // 没有变化时跳过重建，减少启动和请求路径中的额外开销。
    return { changed: false, count: sources.length };
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120
  });
  const docs = await splitter.splitDocuments(
    sources.map(
      (source) =>
        new Document({
          pageContent: source.content,
          metadata: {
            source: source.source,
            id: source.id
          }
        })
    )
  );

  await mkdir(config.ragRoot, { recursive: true });
  const embeddings = createEmbeddingModel();
  const store = await HNSWLib.fromDocuments(docs, embeddings);
  await store.save(config.ragRoot);
  await writeMeta({
    sourceHashes: currentHashes,
    updatedAt: new Date().toISOString()
  });
  return { changed: true, count: sources.length };
}
