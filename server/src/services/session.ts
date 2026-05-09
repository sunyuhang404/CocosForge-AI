import { prisma } from "../lib/prisma.js";
import { ensureSessionFolders } from "../lib/storage.js";

/** 创建新会话并初始化对应的本地目录。 */
export async function createSession(name?: string) {
  const base = await prisma.session.create({
    data: {
      name: name?.trim() || "新游戏项目",
      rootDir: ""
    }
  });
  const folders = await ensureSessionFolders(base.id);
  return prisma.session.update({
    where: { id: base.id },
    data: { rootDir: folders.rootDir }
  });
}

/** 按创建时间倒序返回会话列表。 */
export async function listSessions() {
  return prisma.session.findMany({
    orderBy: { createdAt: "desc" }
  });
}

/** 根据会话 ID 查询单条会话记录。 */
export async function getSessionById(sessionId: string) {
  return prisma.session.findUnique({ where: { id: sessionId } });
}

/** 更新会话所处的生成阶段状态。 */
export async function setSessionStatus(
  sessionId: string,
  status: "PLANNING" | "DEVELOPING" | "DONE"
) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { status }
  });
}

/** 持久化一条会话消息（用户、助手或系统消息）。 */
export async function saveMessage(input: {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  isGameRelated?: boolean;
}) {
  return prisma.message.create({
    data: {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      isGameRelated: input.isGameRelated
    }
  });
}

/** 查询会话消息时间线，按时间正序用于前端回放。 */
export async function listSessionMessages(sessionId: string) {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" }
  });
}

/** 保存会话产物元数据（策划、代码、图片或构建）。 */
export async function saveAsset(input: {
  sessionId: string;
  type: "PLAN" | "CODE" | "IMAGE" | "BUILD";
  fileName: string;
  filePath: string;
  content?: string;
  version: number;
}) {
  return prisma.gameAsset.create({
    data: {
      sessionId: input.sessionId,
      type: input.type,
      fileName: input.fileName,
      filePath: input.filePath,
      content: input.content,
      version: input.version
    }
  });
}

/** 计算指定产物类型的下一个版本号。 */
export async function getNextAssetVersion(
  sessionId: string,
  type: "PLAN" | "CODE" | "IMAGE" | "BUILD"
): Promise<number> {
  const latest = await prisma.gameAsset.findFirst({
    where: { sessionId, type },
    orderBy: { version: "desc" }
  });
  return (latest?.version ?? 0) + 1;
}

/** 获取指定产物类型的最新版本记录。 */
export async function getLatestAsset(
  sessionId: string,
  type: "PLAN" | "CODE" | "IMAGE" | "BUILD"
) {
  return prisma.gameAsset.findFirst({
    where: { sessionId, type },
    orderBy: { version: "desc" }
  });
}
