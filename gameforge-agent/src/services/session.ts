import type { Prisma, Session } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ensureSessionFolders } from "../lib/storage.js";

/** 对外与会话路径使用的标识（与 Session.sessionUuid 一致）；HTTP/存储中入参均为 UUID 字符串。 */
export type PublicSession = {
  id: string;
  name: string;
  status: Session["status"];
  rootDir: string;
  createdAt: string;
  /** 关联的 users.id，未登录或未绑定时不出现 */
  userId?: string;
};

function toPublicSession(s: Session): PublicSession {
  return {
    id: s.sessionUuid,
    name: s.name,
    status: s.status,
    rootDir: s.rootDir,
    createdAt: s.createdAt.toISOString(),
    ...(s.userId != null ? { userId: s.userId.toString() } : {})
  };
}

async function resolveSessionDbId(sessionUuid: string): Promise<bigint> {
  const row = await prisma.session.findUnique({
    where: { sessionUuid },
    select: { id: true }
  });
  if (!row) {
    throw new Error(`Session not found: ${sessionUuid}`);
  }
  return row.id;
}

/** 创建新会话并初始化对应的本地目录。 */
export async function createSession(name?: string, userId?: bigint): Promise<PublicSession> {
  const base = await prisma.session.create({
    data: {
      name: name?.trim() || "新游戏项目",
      rootDir: "",
      ...(userId != null ? { userId } : {})
    }
  });
  const folders = await ensureSessionFolders(base.sessionUuid);
  const updated = await prisma.session.update({
    where: { id: base.id },
    data: { rootDir: folders.rootDir }
  });
  return toPublicSession(updated);
}

/** 按创建时间倒序返回会话列表。 */
export async function listSessions(): Promise<PublicSession[]> {
  const rows = await prisma.session.findMany({
    orderBy: { createdAt: "desc" }
  });
  return rows.map(toPublicSession);
}

/** 根据 sessionUuid 查询单条会话记录。 */
export async function getSessionById(sessionUuid: string) {
  return prisma.session.findUnique({ where: { sessionUuid } });
}

/** 更新会话所处的生成阶段状态。 */
export async function setSessionStatus(
  sessionUuid: string,
  status: "PLANNING" | "DEVELOPING" | "DONE"
): Promise<void> {
  await prisma.session.update({
    where: { sessionUuid },
    data: { status }
  });
}

const SESSION_TITLE_MAX_LEN = 120;

/** 从用户输入首行生成会话标题（用于列表与顶栏）。 */
export function deriveSessionTitleFromUserMessage(rawMessage: string): string {
  const line = rawMessage.split("\n")[0]?.trim() ?? "";
  if (!line) return "新游戏项目";
  return line.length > SESSION_TITLE_MAX_LEN ? `${line.slice(0, SESSION_TITLE_MAX_LEN)}…` : line;
}

/**
 * 若本次保存后为会话内第一条用户消息，则用用户本条原文首行更新 Session.name。
 * 返回新标题；未更新时返回 null。
 */
export async function updateSessionTitleIfFirstUserMessage(
  sessionUuid: string,
  rawUserMessage: string
): Promise<string | null> {
  const userCount = await prisma.message.count({
    where: { session: { sessionUuid }, role: "user" }
  });
  if (userCount !== 1) return null;
  const name = deriveSessionTitleFromUserMessage(rawUserMessage);
  await prisma.session.update({
    where: { sessionUuid },
    data: { name }
  });
  return name;
}

/** 持久化一条会话消息（用户、助手或系统消息）。 */
export async function saveMessage(input: {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  isGameRelated?: boolean;
}) {
  const sessionDbId = await resolveSessionDbId(input.sessionId);
  return prisma.message.create({
    data: {
      sessionId: sessionDbId,
      role: input.role,
      content: input.content,
      isGameRelated: input.isGameRelated
    }
  });
}

/** 查询会话消息时间线，按时间正序用于前端回放。 */
export async function listSessionMessages(sessionUuid: string) {
  const rows = await prisma.message.findMany({
    where: { session: { sessionUuid } },
    orderBy: { createdAt: "asc" }
  });
  return rows.map((m) => ({
    id: m.id.toString(),
    sessionId: sessionUuid,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    isGameRelated: m.isGameRelated ?? undefined
  }));
}

/** 保存会话产物元数据（策划、代码、图片或构建）。 */
export async function saveAsset(input: {
  sessionId: string;
  type: "PLAN" | "CODE" | "IMAGE" | "BUILD";
  fileName: string;
  filePath: string;
  content?: Prisma.InputJsonValue;
  version: number;
}) {
  const sessionDbId = await resolveSessionDbId(input.sessionId);
  return prisma.gameAsset.create({
    data: {
      sessionId: sessionDbId,
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
  sessionUuid: string,
  type: "PLAN" | "CODE" | "IMAGE" | "BUILD"
): Promise<number> {
  const sessionDbId = await resolveSessionDbId(sessionUuid);
  const latest = await prisma.gameAsset.findFirst({
    where: { sessionId: sessionDbId, type },
    orderBy: { version: "desc" }
  });
  return (latest?.version ?? 0) + 1;
}

/** 获取指定产物类型的最新版本记录。 */
export async function getLatestAsset(
  sessionUuid: string,
  type: "PLAN" | "CODE" | "IMAGE" | "BUILD"
) {
  const sessionDbId = await resolveSessionDbId(sessionUuid);
  return prisma.gameAsset.findFirst({
    where: { sessionId: sessionDbId, type },
    orderBy: { version: "desc" }
  });
}
