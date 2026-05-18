# gameforge-agent 技术栈整理

本文档基于清空前的 `gameforge-agent` 代码整理，记录其实际使用到的技术、模块分层和运行链路。

## 运行时与工程形态

- Node.js 20：`package.json` 中通过 Volta 固定 `node=20.20.2`、`npm=10.9.8`。
- TypeScript 5：使用 `strict` 模式，编译目标为 `ES2022`。
- ESM：`package.json` 设置 `"type": "module"`，TS 配置为 `module=NodeNext`、`moduleResolution=NodeNext`。
- tsx：开发环境使用 `tsx watch src/index.ts` 启动。
- dotenv / dotenv-cli：从 `gameforge-agent/.env` 加载运行配置，并在 Prisma 脚本中注入环境变量。

## HTTP 服务

- Koa 2：核心 HTTP 服务框架。
- @koa/router：路由管理。
- koa-bodyparser：解析 JSON 请求体。
- @koa/cors：按 `GAMEFORGE_CLIENT_ORIGIN` 放行前端来源。
- mime-types：预览静态资源接口根据文件名返回响应类型。

主要接口：

- `GET /health`：健康检查。
- `POST /api/sessions`：创建会话，并初始化本地产物目录。
- `GET /api/sessions`：获取会话列表。
- `GET /api/sessions/:id/messages`：获取会话消息。
- `GET /api/sessions/:id/assets/code/latest`：下载最新代码产物。
- `POST /api/chat/stream`：聊天与生成主流程，使用 SSE 流式返回状态。
- `GET /preview/:sessionId/:filePath(.*)`：读取会话构建目录下的预览页面或资源。

## 数据库与持久化

- Prisma 6：ORM 和数据库 schema 管理。
- @prisma/client：业务层访问数据库。
- PostgreSQL：Prisma datasource 使用 `postgresql`，连接串来自 `DATABASE_URL`。

Schema 中包含：

- `User`：用户信息。
- `Session`：游戏生成会话，包含状态、根目录、用户关联。
- `Message`：会话消息，记录 user / assistant / system 内容。
- `GameAsset`：会话产物，记录策划案、代码、图片、构建产物。

状态与枚举：

- `SessionStatus`：`PLANNING`、`DEVELOPING`、`DONE`。
- `MessageRole`：`user`、`assistant`、`system`。
- `AssetType`：`PLAN`、`CODE`、`IMAGE`、`BUILD`。

## AI 与 Agent 编排

- Vercel AI SDK：通过 `ai` 包的 `generateText`、`streamText` 调用模型。
- @ai-sdk/openai：使用 OpenAI 兼容客户端接入 DashScope。
- DashScope Qwen：默认配置为 `QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`，模型默认 `qwen-max`。
- zod：用于 HTTP 请求体校验。

主工作流位于 `agent/orchestrator.ts`，流程为：

1. 合并用户输入和动态表单补充信息。
2. 运行语义护栏，判断请求是否属于游戏开发范围。
3. 运行可行性检查，信息不足时返回动态表单。
4. 通过 RAG 检索知识上下文。
5. 使用流式模型生成策划案，并通过 SSE 推送 `planning_chunk`。
6. 生成 TypeScript 游戏代码。
7. 调用模型做代码审查与修复，必要时重新生成。
8. 写入策划、源码、预览构建产物，并写入数据库资产记录。
9. 返回 `preview_ready` 事件。

## RAG 与知识库

- LangChain OpenAIEmbeddings：通过 `@langchain/openai` 调用 DashScope 的 OpenAI 兼容 embedding 接口。
- 默认 embedding 模型：`text-embedding-v3`。
- @langchain/textsplitters：使用 `RecursiveCharacterTextSplitter` 切分文档，默认 `chunkSize=800`、`chunkOverlap=120`。
- @langchain/community/vectorstores/hnswlib：使用 HNSWLib 本地向量索引。
- hnswlib-node：HNSWLib 的 Node 原生依赖。

知识来源：

- `knowledge/` 下递归读取 `.md` / `.txt` 文件。
- 项目需求文档作为基础知识源。
- `OFFICIAL_DOCS_URL` 预留远程官方文档拉取入口。

索引策略：

- 索引保存到 `.data/vector`。
- 使用 `sha256` 记录知识源哈希。
- 启动时预热索引；知识源无变化时跳过重建。
- 查询时通过 `similaritySearch(query, RAG_TOP_K)` 返回上下文片段。

## 预览与代码产物

- esbuild：将模型生成的 TypeScript / JavaScript 转为浏览器可运行的 ESM。
- 本地文件系统：按会话 ID 写入产物目录。

产物目录约定：

- `storage/{sessionId}/plan`：策划文档，文件名如 `plan-v1.md`。
- `storage/{sessionId}/src`：生成源码，文件名如 `game-v1.ts`。
- `storage/{sessionId}/build`：预览构建，入口为 `index.html`。

预览页面通过 Koa 路由读取 `storage/{sessionId}/build` 下文件，并做路径校验防止目录穿越。

## 实时通信

- 使用 Server-Sent Events。
- `lib/sse.ts` 负责设置 `text/event-stream` 响应头、写入具名事件和关闭连接。

事件类型：

- `guardrail_result`
- `question_form`
- `planning_chunk`
- `codegen_progress`
- `session_renamed`
- `preview_ready`
- `error`

## 配置项

主要环境变量：

- `PORT`
- `GAMEFORGE_CLIENT_ORIGIN`
- `DATABASE_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `QWEN_API_KEY`
- `QWEN_BASE_URL`
- `QWEN_MODEL`
- `QWEN_EMBEDDING_MODEL`
- `RAG_TOP_K`
- `OFFICIAL_DOCS_URL`
- `PREVIEW_BASE_URL`
- `CHROMA_HOST`
- `CHROMA_PORT`
- `CHROMA_COLLECTION`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `ROCKETMQ_NAME_SERVER`
- `NAMESRV_ADDR`
- `ROCKETMQ_PRODUCER_GROUP`

其中 Chroma、Redis、RocketMQ 在配置中已有预留，但清空前的 agent 主业务链路没有真正接入对应客户端。

## 清空前模块分层

- `src/index.ts`：Koa 启动入口，中间件、路由、预览静态读取、RAG 预热。
- `src/config.ts`：环境变量、工作区路径、外部服务配置。
- `src/routes/`：HTTP API 层。
- `src/agent/`：护栏、策划、代码生成编排和 prompt。
- `src/integrations/`：RAG、embedding 模型封装。
- `src/services/`：会话、产物、知识库 ingest、代码生成。
- `src/lib/`：Prisma、SSE、存储路径、代码清洗工具。
- `src/scripts/rebuild-index.ts`：手动重建知识索引脚本。
- `prisma/schema.prisma`：数据库模型定义。

