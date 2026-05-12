import Router from "@koa/router";
import type { Context } from "koa";
import { z } from "zod";
import { initSse, writeSseEvent, endSse } from "../lib/sse.js";
import { runChatWorkflow } from "../agent/orchestrator.js";
import type { ChatRequestBody } from "../types.js";
import { getSessionById } from "../services/session.js";

const schema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1),
  formAnswers: z.record(z.string(), z.union([z.string(), z.number()])).optional()
});

/** 聊天流式接口路由，负责参数校验、会话校验与 SSE 编排调用。 */
export const chatRouter = new Router({ prefix: "/api/chat" });

/**
 * POST /api/chat/stream
 * 建立 SSE 连接并执行聊天工作流，将阶段事件实时回传给客户端。
 */
chatRouter.post("/stream", async (ctx: Context) => {
  const parsed = schema.safeParse(ctx.request.body ?? {});
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = { error: "请求参数错误", detail: parsed.error.flatten() };
    return;
  }
  const session = await getSessionById(parsed.data.sessionId);
  if (!session) {
    ctx.status = 404;
    ctx.body = { error: "会话不存在" };
    return;
  }

  // 在业务流程开始前初始化 SSE，确保后续事件可被客户端持续接收。
  initSse(ctx);
  try {
    await runChatWorkflow(parsed.data as ChatRequestBody, (event, payload) => {
      writeSseEvent(ctx, event, payload as never);
    });
  } catch (error) {
    // 运行时异常统一转换为 SSE error 事件，避免连接无响应。
    writeSseEvent(ctx, "error", {
      message: error instanceof Error ? error.message : "服务异常"
    });
  } finally {
    endSse(ctx);
  }
});
