import type { MessageItem, SessionItem } from "@/types";
import { getAccessToken } from "./authSession";

const baseUrl = "http://localhost:8080";

type ApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

type ApiRequestOptions = {
  skipAuth?: boolean;
};

type RequestInitWithJsonBody = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export class ApiError extends Error {
  status?: number;
  code?: number;

  constructor(message: string, status?: number, code?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function isApiResult<T>(value: unknown): value is ApiResult<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "data" in value
  );
}

function buildHeaders(init: RequestInitWithJsonBody, options: ApiRequestOptions) {
  const headers = new Headers(init.headers);
  const hasJsonBody =
    init.body !== undefined &&
    init.body !== null &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof URLSearchParams);

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.skipAuth ? "" : getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function normalizeBody(body: RequestInitWithJsonBody["body"]) {
  if (
    body === undefined ||
    body === null ||
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams
  ) {
    return body;
  }
  return JSON.stringify(body);
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  path: string,
  init: RequestInitWithJsonBody = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: buildHeaders(init, options),
    body: normalizeBody(init.body),
  });
  const payload = await readJson(response);

  if (response.status === 401) {
    const message = isApiResult<unknown>(payload) ? payload.message : undefined;
    throw new ApiError(message || "未登录", response.status, 401);
  }

  if (!response.ok) {
    const message = isApiResult<unknown>(payload) ? payload.message : "请求失败";
    throw new ApiError(message, response.status);
  }

  if (isApiResult<T>(payload)) {
    if (payload.code === 401) {
      throw new ApiError(payload.message, response.status, payload.code);
    }
    if (payload.code !== 0) {
      throw new ApiError(payload.message || "请求失败", response.status, payload.code);
    }
    return payload.data;
  }

  return payload as T;
}

export async function createSession(name?: string): Promise<SessionItem> {
  return apiRequest<SessionItem>("/api/sessions", {
    method: "POST",
    body: { name },
  });
}

export async function fetchSessions(): Promise<SessionItem[]> {
  return apiRequest<SessionItem[]>("/api/sessions");
}

export async function fetchSessionMessages(sessionId: string): Promise<MessageItem[]> {
  return apiRequest<MessageItem[]>(`/api/sessions/${sessionId}/messages`);
}

export const apiBaseUrl = baseUrl;
