import type { Context } from "koa";
import type { SseEventPayloadMap } from "../types.js";

/** 初始化 SSE 响应头，建立长连接事件流。 */
export function initSse(ctx: Context): void {
  ctx.set("Content-Type", "text/event-stream");
  ctx.set("Cache-Control", "no-cache");
  ctx.set("Connection", "keep-alive");
  ctx.status = 200;
}

/** 写入一条具名 SSE 事件及其 JSON 负载。 */
export function writeSseEvent<K extends keyof SseEventPayloadMap>(
  ctx: Context,
  event: K,
  payload: SseEventPayloadMap[K]
): void {
  ctx.res.write(`event: ${String(event)}\n`);
  ctx.res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** 结束 SSE 流并关闭响应。 */
export function endSse(ctx: Context): void {
  ctx.res.end();
}
