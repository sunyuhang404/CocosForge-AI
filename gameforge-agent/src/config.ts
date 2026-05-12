import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const serverSrcDir = path.dirname(currentFile);
const serverDir = path.resolve(serverSrcDir, "..");
const workspaceRoot = path.resolve(serverDir, "..");
const rootEnvPath = path.resolve(workspaceRoot, ".env");
const serverEnvPath = path.resolve(serverDir, ".env");

// 优先加载工作区根目录 .env，不存在时回退到 gameforge-agent/.env。
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}

/** 服务端运行配置与外部依赖连接参数。 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://admin:your_password@10.5.32.22:5432/game_forge",
  tz: process.env.TZ ?? "Asia/Shanghai",
  postgres: {
    host: process.env.POSTGRES_HOST ?? "10.5.32.22",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? "admin",
    password: process.env.POSTGRES_PASSWORD ?? "your_password",
    db: process.env.POSTGRES_DB ?? "game_forge",
  },
  qwenApiKey: process.env.QWEN_API_KEY ?? "",
  qwenBaseUrl:
    process.env.QWEN_BASE_URL ??
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
  qwenModel: process.env.QWEN_MODEL ?? "qwen-max",
  qwenEmbeddingModel: process.env.QWEN_EMBEDDING_MODEL ?? "text-embedding-v3",
  chroma: {
    host: process.env.CHROMA_HOST ?? "10.5.32.22",
    port: Number(process.env.CHROMA_PORT ?? 8000),
    collection: process.env.CHROMA_COLLECTION ?? "gameforge_knowledge",
  },
  redis: {
    host: process.env.REDIS_HOST ?? "10.5.32.22",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? "",
    db: Number(process.env.REDIS_DB ?? 0),
  },
  /**
   * RocketMQ：nameServer 与 Java gameforge 的 rocketmq.name-server / ROCKETMQ_NAME_SERVER 一致；
   * 也可使用 Docker 常用变量 NAMESRV_ADDR（仅当未设置 ROCKETMQ_NAME_SERVER 时生效）。
   */
  rocketmq: {
    nameServer:
      process.env.ROCKETMQ_NAME_SERVER ??
      process.env.NAMESRV_ADDR ??
      "127.0.0.1:9876",
    producerGroup:
      process.env.ROCKETMQ_PRODUCER_GROUP ?? "gameforge-agent-producer",
  },
  ragTopK: Number(process.env.RAG_TOP_K ?? 4),
  officialDocsUrl: process.env.OFFICIAL_DOCS_URL ?? "",
  previewBaseUrl:
    process.env.PREVIEW_BASE_URL ?? "http://localhost:3000/preview",
  workspaceRoot,
  storageRoot: path.resolve(workspaceRoot, "storage"),
  ragRoot: path.resolve(serverDir, ".data", "vector"),
  knowledgeRoot: path.resolve(workspaceRoot, "knowledge"),
};
