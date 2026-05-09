太棒了，追求技术的前沿性是程序员的浪漫。既然要“新颖”，我们就不只是简单地调用 API，而是引入 **AI Agent 智能体架构**、**中后台流式渲染**以及**现代化的工程化方案**。

这是为你重新深度打磨的 **CocosForge AI - 极客版** 项目文档。

---

# 项目需求文档：CocosForge AI (Ultimate Edition)

## 1. 项目定义

**CocosForge AI** 是一个集成了 **LLM 意图识别、RAG（检索增强生成）与自动化构建流**的 AI Agent 服务。它通过通义千问大模型，实现从“自然语言需求”到“2D 网页游戏”的一键闭环。

## 2. 前沿技术栈选型

### **后端 (Agent Server)**

- **核心框架:** `Koa2` + `Vercel AI SDK` (提供标准化的流式输出流)。
- **Agent 编排:** `LangChain.js` (利用其 **Chains** 和 **Memory** 模块处理复杂的校验逻辑)。
- **模型接入:** **通义千问 (Qwen-Max)**，通过 OpenAI 兼容协议接入，确保逻辑推理上限。
- **长效记忆:** `Vector Database` (如 Chroma 或 Pinecone，可选)，用于存储 Cocos 官方文档，让 AI 生成的代码更准确（RAG）。

### **前端 (Modern Web)**

- **底层框架:** `Vue 3.4+` (使用最新的 `defineModel` 等特性)。
- **状态管理:** `Pinia`。
- **UI 体系:** `Element-Plus` + `Tailwind CSS` (快速实现高度定制化布局)。
- **通信:** `Server-Sent Events (SSE)`，通过 Vercel AI SDK 的前端 Hooks 渲染打字机效果。

### **自动化构建 (DevOps)**

- **沙箱环境:** 使用 `Node.js` 子进程动态生成 Cocos 项目结构。
- **静态托管:** 生成的游戏代码直接映射到特定的静态资源目录，由 Koa 提供静态服务。

---

## 3. 核心功能与流程 (Agentic Workflow)

### **第一阶段：多层防护拦截 (Multi-layer Guardrails)**

用户输入消息后，后端不直接进入生成，而是通过 LangChain 运行两个 **Checking Chain**：

1. **Semantic Filter:** 判定是否为游戏开发相关。若用户问“如何做红烧肉”，Agent 会以游戏开发者的身份幽默拒绝。
2. **Feasibility Check:** AI 评估当前描述是否足以构成一个游戏逻辑。

- _判定结果:_ 若信息不足，AI 会生成一个 **JSON 表单结构**，前端根据此结构动态追问用户（如：背景图风格、重力参数等）。

### **第二阶段：流式策划生成 (Streaming Design)**

- 验证通过后，Agent 切换为“游戏策划”角色，流式输出详细的 Markdown 策划案。
- 侧边栏实时展示进度：`[策划中...70%]`。

### **第三阶段：代码生成与热加载 (Code Gen & Hot Reload)**

- Agent 调用专用 Prompt 生成 `TypeScript` 脚本。
- 后端检测到代码生成完毕，自动刷新前端右侧的 `<iframe>`。

---

## 4. 界面布局设计 (UI/UX)

- **左侧 (300px Fixed):**
- 深色调设计，极客风格聊天窗口。
- 支持代码块高亮显示。
- 底部带有“重置对话”和“当前状态指示灯”。

- **右侧 (Flexible):**
- 上方为控制条（刷新、下载代码、全屏）。
- 下方为游戏运行容器。
- **新颖交互:** 游戏区域在加载时有高斯模糊渐变效果。

---

## 5. 核心代码设计思路 (给 AI 的指令)

> **Prompt 示例：**
> “请使用 **Vercel AI SDK** 的 `streamText` 函数配合通义千问模型。在发送给模型之前，先通过一个 `toolCall` 流程判断用户的意图。如果用户的信息不足以生成 Cocos 游戏（缺少玩法、胜负判定、控制方式），请不要进入代码生成阶段，而是通过流式回复向用户追问。前端请用 **Vue3** 实现左右分栏，并确保游戏 Iframe 在代码构建完成后能自动重载。”

---

## 6. 项目起名建议

1. **CocosForge AI** (硬核、锻造感) —— **推荐**
2. **QwenGame Engine** (强调千问内核)
3. **SpriteMind** (精灵之思，适合 2D 游戏)
4. **AetherCode 2D** (以太代码)

---

### 💡 为什么这样选型？

- **Vercel AI SDK**: 它是目前处理 AI 流式输出最简洁、最现代的方案，能极大地减轻你处理 SSE 的痛苦。
- **LangChain.js**: 它的 `RunnableSequence` 可以非常优雅地串联你的“校验 -> 追问 -> 生成”逻辑，而不是写一堆嵌套的 `if-else`。
- **Tailwind CSS**: 配合 Element-Plus，能让你的界面看起来不像普通的管理后台，更有“AI 原生应用”的高级感。

这份文档现在已经完全“武装到了牙齿”，你可以直接发给 AI 开启你的开发之旅了！
