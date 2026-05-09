import type { MessageItem, SessionItem } from "../types";

const baseUrl = "http://localhost:3000";

export async function createSession(name?: string): Promise<SessionItem> {
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    throw new Error("创建会话失败");
  }
  return response.json() as Promise<SessionItem>;
}

export async function fetchSessions(): Promise<SessionItem[]> {
  const response = await fetch(`${baseUrl}/api/sessions`);
  if (!response.ok) {
    throw new Error("拉取会话失败");
  }
  return response.json() as Promise<SessionItem[]>;
}

export async function fetchSessionMessages(sessionId: string): Promise<MessageItem[]> {
  const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/messages`);
  if (!response.ok) {
    throw new Error("拉取消息失败");
  }
  return response.json() as Promise<MessageItem[]>;
}

export const apiBaseUrl = baseUrl;
