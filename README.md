# GameForge AI

GameForge AI 是一个面向 2D 网页游戏的 AI Agent 应用。系统将自然语言需求转成策划案与代码，并在右侧预览区自动刷新构建结果。

## 技术栈

- 服务端：Koa + Prisma + PostgreSQL + Vercel AI SDK + LangChain(HNSWLib)
- 客户端：Vue3 + Pinia + Element Plus + Tailwind + Vite
- RAG：DashScope `text-embedding-v3` + 本地 `HNSWLib` 向量索引

## 目录结构

- `gameforge/`：Spring Boot 工程（JDBC/Redis 等，与 Agent 配置对齐）
- `gameforge-agent/`：Agent 服务（Koa：API、SSE、编排、RAG、持久化）
- `client/`：聊天与预览界面
- `storage/`：会话产物根目录（与 `gameforge-agent` 同级）
- `knowledge/`：本地知识文档来源（RAG ingest 输入）

会话产物目录规范：

- `storage/{sessionId}/plan`：策划文档
- `storage/{sessionId}/src`：代码产物
- `storage/{sessionId}/build`：预览静态网页

## 环境变量

复制 `.env.example` 为 `.env`，至少填写：

- `DATABASE_URL`
- `QWEN_API_KEY`
- `QWEN_BASE_URL`（默认 DashScope OpenAI 兼容地址）
- `QWEN_MODEL`
- `QWEN_EMBEDDING_MODEL=text-embedding-v3`

当前你的远端 Docker 可直接用以下配置：

- PostgreSQL：`10.5.32.22:5432`
  - `POSTGRES_USER=admin`
  - `POSTGRES_PASSWORD=your_password`
  - `POSTGRES_DB=game_forge`
  - 推荐 `DATABASE_URL=postgresql://admin:your_password@10.5.32.22:5432/game_forge`
- ChromaDB：`10.5.32.22:8000`
- Redis：`10.5.32.22:6379`
- RocketMQ（与 `gameforge` Java 端一致）：`ROCKETMQ_NAME_SERVER`（或 Docker 的 `NAMESRV_ADDR`，如 `rmqnamesrv:9876` / `127.0.0.1:9876`）；可选 `ROCKETMQ_PRODUCER_GROUP`（默认 `gameforge-agent-producer`）

说明：

- 当前代码路径中，核心持久化数据库已使用 PostgreSQL（Prisma）。
- RAG 主链路仍按计划使用本地 `HNSWLib`。`CHROMA_*` 与 `REDIS_*` 已预留配置项，便于你后续切换到 Chroma/Redis。
- `gameforge-agent` 已在 [`src/config.ts`](gameforge-agent/src/config.ts) 中加载 `rocketmq` 配置；业务发送/消费需自行接入 RocketMQ Node 客户端后再使用 `config.rocketmq`。

## 启动步骤

1. 安装依赖：`npm install`
2. 生成 Prisma Client：`npm run prisma:generate -w gameforge-agent`
3. 推送数据库结构：`npm run prisma:push -w gameforge-agent`
4. 构建向量索引（手动兜底）：`npm run ingest`
5. 启动双端：`npm run dev`

## 常用脚本

- `npm run dev`：同时启动 gameforge-agent / client
- `npm run build`：构建双端
- `npm run lint`：类型检查
- `npm run ingest`：重建/补建向量索引

## API 概览

- `POST /api/sessions`：创建会话并初始化 `storage/{sessionId}/{plan,src,build}`
- `GET /api/sessions`：获取会话列表
- `GET /api/sessions/:id/messages`：获取会话消息
- `GET /api/sessions/:id/assets/code/latest`：下载最新代码产物
- `POST /api/chat/stream`：SSE 主流程（guardrails/追问/策划流/代码生成/预览完成）
