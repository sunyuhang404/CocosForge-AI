import Router from "@koa/router";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import type { Context } from "koa";
import { z } from "zod";
import {
  createSession,
  getLatestAsset,
  listSessionMessages,
  listSessions
} from "../services/session.js";

const createSchema = z.object({
  name: z.string().trim().min(1).max(100).optional()
});

/** 会话管理接口路由，负责会话创建、查询和代码产物下载。 */
export const sessionsRouter = new Router({ prefix: "/api/sessions" });

/** POST /api/sessions：创建一个新的游戏会话。 */
sessionsRouter.post("/", async (ctx: Context) => {
  const parsed = createSchema.safeParse(ctx.request.body ?? {});
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = { error: "参数不合法" };
    return;
  }
  const session = await createSession(parsed.data.name);
  ctx.body = session;
});

/** GET /api/sessions：获取会话列表。 */
sessionsRouter.get("/", async (ctx: Context) => {
  const sessions = await listSessions();
  ctx.body = sessions;
});

/** GET /api/sessions/:id/messages：读取指定会话的消息历史。 */
sessionsRouter.get("/:id/messages", async (ctx: Context) => {
  const messages = await listSessionMessages(ctx.params.id);
  ctx.body = messages;
});

/**
 * GET /api/sessions/:id/assets/code/latest
 * 下载会话的最新代码产物。
 */
sessionsRouter.get("/:id/assets/code/latest", async (ctx: Context) => {
  const asset = await getLatestAsset(ctx.params.id, "CODE");
  if (!asset) {
    ctx.status = 404;
    ctx.body = { error: "暂无代码产物" };
    return;
  }
  try {
    await access(asset.filePath);
    ctx.set("Content-Disposition", `attachment; filename="${asset.fileName}"`);
    ctx.type = "application/typescript";
    ctx.body = createReadStream(asset.filePath);
  } catch {
    // 数据库中有记录但磁盘文件不存在时，返回 404 避免下载空流。
    ctx.status = 404;
    ctx.body = { error: "代码文件不存在" };
  }
});
