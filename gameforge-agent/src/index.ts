import { config } from "./config.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import cors from "@koa/cors";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import Koa from "koa";
import mime from "mime-types";
import { ensureStorageRoot, getSessionFolders } from "./lib/storage.js";
import { prisma } from "./lib/prisma.js";
import { sessionsRouter } from "./routes/sessions.js";
import { chatRouter } from "./routes/chat.js";
import { warmupRagIndex } from "./integrations/rag.js";

const app = new Koa();
const router = new Router();

/**
 * 兼容 CommonJS/ESM 导出差异，统一提取中间件工厂函数。
 */
function asMiddleware<T>(mod: T): T extends { default: infer D } ? D : T {
  return ((mod as { default?: unknown }).default ?? mod) as T extends { default: infer D } ? D : T;
}

const corsMiddlewareFactory = asMiddleware(cors);
const bodyParserMiddlewareFactory = asMiddleware(bodyParser);

/** 统一注册中间件，保持入口文件的挂载顺序显式可见。 */
function registerMiddleware(middleware: unknown): void {
  app.middleware.push(middleware as Koa.Middleware);
}

registerMiddleware(
  corsMiddlewareFactory({
    origin: config.gameforgeClientOrigin
  })
);
registerMiddleware(bodyParserMiddlewareFactory());

router.get("/health", (ctx) => {
  ctx.body = { ok: true };
});

/**
 * 预览静态资源读取接口。
 * 仅允许访问会话构建目录内文件，防止目录穿越。
 */
router.get("/preview/:sessionId/:filePath(.*)", async (ctx) => {
  const { sessionId, filePath } = ctx.params;
  const resolved = path.resolve(getSessionFolders(sessionId).buildDir, filePath || "index.html");
  if (!resolved.startsWith(getSessionFolders(sessionId).buildDir)) {
    ctx.status = 403;
    return;
  }
  try {
    const content = await readFile(resolved);
    ctx.type = (mime.lookup(resolved) || "application/octet-stream") as string;
    ctx.body = content;
  } catch {
    ctx.status = 404;
    ctx.body = { error: "预览资源不存在" };
  }
});

registerMiddleware(router.routes());
registerMiddleware(router.allowedMethods());
registerMiddleware(sessionsRouter.routes());
registerMiddleware(sessionsRouter.allowedMethods());
registerMiddleware(chatRouter.routes());
registerMiddleware(chatRouter.allowedMethods());

/**
 * 服务启动入口。
 * 负责初始化存储目录、预热检索索引并监听 HTTP 端口。
 */
async function bootstrap(): Promise<void> {
  await ensureStorageRoot();
  await warmupRagIndex().catch((error) => {
    console.warn("[rag] warmup failed:", error instanceof Error ? error.message : error);
  });
  app.listen(config.port, () => {
    console.log(`Server ready at http://localhost:${config.port}`);
  });
}

// 启动失败时释放数据库连接并以非零码退出。
bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

// 响应 Ctrl+C，优雅关闭数据库连接。
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
