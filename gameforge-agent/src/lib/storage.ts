import { mkdir } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

export type SessionFolders = {
  rootDir: string;
  planDir: string;
  srcDir: string;
  buildDir: string;
};

/** 确保存储根目录存在。 */
export async function ensureStorageRoot(): Promise<void> {
  await mkdir(config.storageRoot, { recursive: true });
}

/** 根据会话 ID 计算各类产物目录路径。 */
export function getSessionFolders(sessionId: string): SessionFolders {
  const rootDir = path.resolve(config.storageRoot, sessionId);
  return {
    rootDir,
    planDir: path.resolve(rootDir, "plan"),
    srcDir: path.resolve(rootDir, "src"),
    buildDir: path.resolve(rootDir, "build")
  };
}

/** 创建会话目录结构（root/plan/src/build）并返回目录信息。 */
export async function ensureSessionFolders(sessionId: string): Promise<SessionFolders> {
  const folders = getSessionFolders(sessionId);
  await mkdir(folders.rootDir, { recursive: true });
  await mkdir(folders.planDir, { recursive: true });
  await mkdir(folders.srcDir, { recursive: true });
  await mkdir(folders.buildDir, { recursive: true });
  return folders;
}
