import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

export type SourceDocument = {
  id: string;
  source: string;
  content: string;
};

/** 递归读取本地知识库目录中的 Markdown/Text 文档。 */
async function readLocalKnowledgeDocs(): Promise<SourceDocument[]> {
  const docs: SourceDocument[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: Array<{ name: string; isDirectory: () => boolean }>;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith(".md") && !entry.name.endsWith(".txt")) {
        continue;
      }
      const content = await readFile(entryPath, "utf8");
      const relativePath = path.relative(config.knowledgeRoot, entryPath);
      docs.push({ id: `local:${relativePath}`, source: entryPath, content });
    }
  }
  await walk(config.knowledgeRoot);
  return docs;
}

/** 读取项目需求文档，作为稳定的基础知识源。 */
async function readRequirementDoc(): Promise<SourceDocument> {
  const source = `${config.workspaceRoot}/REQUIREMENT.md`;
  const content = await readFile(source, "utf8");
  return { id: "local:REQUIREMENT.md", source, content };
}

/** 预留官方文档远程拉取入口，不可用时降级为空。 */
async function readOfficialDocsPlaceholder(): Promise<SourceDocument[]> {
  if (!config.officialDocsUrl) {
    return [];
  }
  try {
    const response = await fetch(config.officialDocsUrl);
    if (!response.ok) {
      return [];
    }
    const content = await response.text();
    return [{ id: "official:remote", source: config.officialDocsUrl, content }];
  } catch {
    return [];
  }
}

/** 汇总所有知识源文档，供向量索引与检索流程使用。 */
export async function loadKnowledgeSources(): Promise<SourceDocument[]> {
  const docs = await readLocalKnowledgeDocs();
  const requirement = await readRequirementDoc();
  const official = await readOfficialDocsPlaceholder();
  return [requirement, ...docs, ...official];
}
