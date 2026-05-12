import { PrismaClient } from "@prisma/client";

/** 全局共享的 Prisma 客户端实例。 */
export const prisma = new PrismaClient();
