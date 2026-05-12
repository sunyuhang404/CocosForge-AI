# GameForge AI 项目复刻指南

本文档用于把当前仓库的实现完整交付给第三方。目标是：把这份文档发给别人，别人用 AI 读取后，能复刻出同等能力与相同结构的项目。

本文档以当前代码为唯一基准，不以早期讨论稿为准。

---

## 1. 项目目标与边界

`GameForge AI` 是一个从自然语言到 2D 网页游戏产物的 Agent 应用，覆盖以下闭环：

1. 多会话管理（会话创建/切换/历史记录）
2. 输入 Guardrails（游戏相关性、信息充分性）
3. 信息不足时生成动态追问表单
4. 通过后流式输出策划案（SSE）
5. 生成代码、构建预览页面、自动刷新预览链接
6. 会话消息与资产落库
7. 会话产物落盘（`plan/src/build`）

---

## 2. 技术栈与版本约束

### 2.1 Monorepo

- Workspace 根：`package.json`
- 子项目：
  - `gameforge/`
  - `gameforge-agent/`
  - `client/`

### 2.2 后端

- Runtime: Node.js（项目通过 Volta 固定版本）
- Framework: Koa + Router + bodyParser + CORS
- ORM: Prisma + PostgreSQL
- AI: Vercel AI SDK + Qwen(OpenAI 兼容)
- RAG: DashScope `text-embedding-v3` + LangChain HNSWLib

### 2.3 前端

- Vue 3 + Vite + Pinia
- Element Plus + Tailwind
- SSE 自定义解析（fetch + ReadableStream）

### 2.4 Node 固定版本（必须）

根 `package.json` 已固定：

- Node: `20.20.2`
- npm: `10.9.8`

如果本机默认 Node 非 20，建议用：

```powershell
volta run npm run dev
```

---

## 3. 目录结构与职责

```text
/
├─ client/                      # 前端 UI 与状态管理
├─ gameforge/                   # Spring Boot（与 Agent 配置对齐）
├─ gameforge-agent/             # Agent 服务（Koa：API、编排、RAG、持久化）
├─ storage/                     # 会话产物根目录
│  └─ {sessionId}/
│     ├─ plan/                  # 策划文档
│     ├─ src/                   # 代码产物
│     └─ build/                 # 预览静态网页
├─ knowledge/                   # RAG ingest 输入文档
└─ doc/                         # 项目文档（本文件）
```

---

## 4. 数据库模型（Prisma）

文件：`gameforge-agent/prisma/schema.prisma`

### 4.1 Session

- `id: String(uuid)`
- `name: String`（默认“新游戏项目”）
- `status: PLANNING | DEVELOPING | DONE`
- `rootDir: String`（对应 `storage/{sessionId}`）
- `createdAt`, `updatedAt`

### 4.2 Message

- `id`
- `sessionId`（外键到 Session）
- `role: user | assistant | system`
- `content: Text`
- `isGameRelated?: Boolean`
- `createdAt`

### 4.3 GameAsset

- `id`
- `sessionId`
- `type: PLAN | CODE | IMAGE | BUILD`
- `fileName`
- `filePath`
- `content?: Text`
- `version: Int`
- `createdAt`

---

## 5. 后端核心流程

### 5.1 入口与中间件

文件：`gameforge-agent/src/index.ts`

- 启动 Koa
- 注册 CORS / bodyParser / 路由
- `GET /health`
- `GET /preview/:sessionId/:filePath(.*)` 提供构建产物静态访问
- 启动前执行：
  - `ensureStorageRoot()`
  - `warmupRagIndex()`

### 5.2 会话接口

文件：`gameforge-agent/src/routes/sessions.ts`

- `POST /api/sessions`：创建会话并初始化目录
- `GET /api/sessions`：会话列表
- `GET /api/sessions/:id/messages`：会话消息
- `GET /api/sessions/:id/assets/code/latest`：下载最新代码文件

### 5.3 主流程接口（SSE）

文件：`gameforge-agent/src/routes/chat.ts`

- `POST /api/chat/stream`
- 入参：`sessionId`, `message`, `formAnswers?`
- 流程：
  1. 参数校验 + 会话校验
  2. 初始化 SSE
  3. 调用 `runChatWorkflow(...)`
  4. 输出事件流并结束连接

### 5.4 Agent 编排

文件：`gameforge-agent/src/agent/orchestrator.ts`

状态机概览：

1. Guardrails 检查（`evaluateGuardrails`）
2. `blocked`：直接回复拒绝文案
3. `needs_more_info`：返回动态表单事件
4. `pass`：进入策划流式输出 -> 代码生成 -> 预览构建
5. 过程中写入 Message / GameAsset，并推进 Session.status

### 5.5 RAG 流程

关键文件：

- `gameforge-agent/src/services/ingest.ts`
- `gameforge-agent/src/integrations/rag.ts`
- `gameforge-agent/src/integrations/embeddings.ts`
- `gameforge-agent/src/services/sources.ts`

机制：

- 从 `knowledge/` + `REQUIREMENT.md` 读取文本
- 切分后走 DashScope embedding
- 构建并持久化 HNSWLib 索引到 `gameforge-agent/.data/vector`
- 启动时增量检查，`npm run ingest` 可手动重建

---

## 6. 前端核心流程

### 6.1 布局

文件：`client/src/App.vue`

- 整体两栏：
  - 左栏：会话侧边栏（顶部品牌、新对话、历史列表、底部用户区）
  - 右栏：上方 header（会话标题 + 状态），下方聊天区域
- 右侧 header 标题规则：
  - 当前会话第一条 `user` 消息首行
  - 若无 user 消息，回退会话名

### 6.2 聊天区与输入区

文件：`client/src/components/chat/ChatPanel.vue`

- 消息流显示 + 动态表单渲染
- 底部输入区采用豆包风输入组件样式
- 预览开关、清空、发送都在输入区工具位
- 聊天内容宽度收敛：`max-w-[800px]`

### 6.3 状态管理

文件：`client/src/stores/chat.ts`

- 管理 `sessions/currentSession/messages/dynamicForm/previewUrl/status/loading`
- `createNewSession/switchSession/sendMessage`
- `sendMessage` 通过 SSE 事件驱动界面更新

### 6.4 SSE 客户端

文件：`client/src/services/sse.ts`

- 基于 `fetch` + `ReadableStream`
- 按 `event:` / `data:` 解析块消息
- 事件透传给 store

---

## 7. SSE 事件契约

后端定义见 `gameforge-agent/src/types.ts`：

- `guardrail_result`
- `question_form`
- `planning_chunk`
- `codegen_progress`
- `preview_ready`
- `error`

前端按事件更新：

- `planning_chunk` 追加策划文本
- `question_form` 渲染动态表单
- `preview_ready` 更新 iframe URL
- `codegen_progress` 更新状态文案

---

## 8. 环境变量与配置

参考：`.env.example`

最小必填：

- `DATABASE_URL`
- `QWEN_API_KEY`
- `QWEN_BASE_URL`
- `QWEN_MODEL`
- `QWEN_EMBEDDING_MODEL`

可选扩展：

- `CHROMA_*`（当前仅预留）
- `REDIS_*`（当前仅预留）
- `OFFICIAL_DOCS_URL`

注意：文档与仓库中严禁出现真实密钥，统一使用占位符。

---

## 9. 启动与复现步骤（Windows + PowerShell）

```powershell
# 1) 安装依赖
npm install

# 2) 生成 Prisma Client
npm run prisma:generate -w gameforge-agent

# 3) 推送数据库 schema
npm run prisma:push -w gameforge-agent

# 4) 构建/增量更新向量索引
npm run ingest

# 5) 启动前后端
npm run dev
```

如果本地 Node 不是 20，可改用：

```powershell
volta run npm run dev
```

---

## 10. 验收清单（交付方自测）

- 能创建新会话，且数据库有 Session 记录
- 会话目录自动创建：`storage/{sessionId}/{plan,src,build}`
- 非游戏请求触发拦截
- 信息不足时返回并渲染动态追问表单
- 信息充分时能流式输出策划文本
- 代码生成后可下载最新代码文件
- 预览地址可访问并自动刷新
- 历史会话切换后消息与 header 标题正确切换

---

## 11. 关键决策与踩坑（高价值）

### 11.1 会话资产必须“先建目录再写库”

- 创建 Session 后立即初始化 `storage/{sessionId}` 子目录
- `Session.rootDir` 记录实际根路径

### 11.2 `.env` 路径统一问题

- 脚本在 `gameforge-agent` 目录执行时，容易读不到根目录 `.env`
- 已通过脚本与配置双重方式解决：
  - Prisma 脚本显式 `dotenv -e ../.env -- ...`
  - `gameforge-agent/src/config.ts` 启动时优先读取根 `.env`

### 11.3 Node 版本兼容

- 在 Node 22 环境下出现 Koa 启动兼容问题（`is-generator-function` 链路）
- 项目通过 Volta 固定 Node 20，避免运行时不一致

### 11.4 前端布局与滚动条

- 使用 `h-screen + flex + min-h-0 + overflow-hidden` 控制外层高度
- 只允许内部区域滚动，避免页面整体滚动条

### 11.5 安全策略

- 配置文档只写变量名和占位符
- 不在仓库和共享文档中写真实 key/token/password

---

## 12. 交给 AI 复刻时的推荐提示词

可把下面文字直接发给 AI：

```text
请严格按文档《doc/PROJECT_REPRODUCTION_GUIDE.md》复刻项目，要求：
1) 目录结构、接口、数据库模型、SSE 事件、存储路径与文档一致；
2) 前后端均可启动，且通过文档中的验收清单；
3) 仅使用占位符配置，不在代码和文档写入真实密钥；
4) 若发现实现与文档冲突，以文档定义为准并在变更说明中标注。
```

---

## 13. 版本声明

- 本文档基于当前仓库代码状态生成。
- 若后续代码变更，请同步更新本文件，确保“文档即实现契约”。
