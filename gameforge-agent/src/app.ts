import cors from "@koa/cors";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import Koa from "koa";

export function createApp(): Koa {
  const app = new Koa();
  const router = new Router();

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      ctx.status = error instanceof Error && "status" in error ? Number(error.status) : 500;
      ctx.body = {
        error: ctx.status === 500 ? "Internal Server Error" : "Request Failed"
      };
      ctx.app.emit("error", error, ctx);
    }
  });

  app.use(cors());
  app.use(bodyParser());

  router.get("/health", (ctx) => {
    ctx.body = {
      ok: true,
      service: "gameforge-agent"
    };
  });

  router.get("/", (ctx) => {
    ctx.body = {
      name: "gameforge-agent",
      status: "empty koa shell"
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
