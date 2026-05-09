import { apiBaseUrl } from "./api";

export type SseHandlers = {
  onEvent: (event: string, payload: unknown) => void;
  onError?: (message: string) => void;
};

export async function streamChat(
  payload: { sessionId: string; message: string; formAnswers?: Record<string, string | number> },
  handlers: SseHandlers
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok || !response.body) {
    handlers.onError?.("SSE 连接失败");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const eventLine = block.split("\n").find((line) => line.startsWith("event:"));
      const dataLine = block.split("\n").find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) {
        continue;
      }
      const event = eventLine.replace("event:", "").trim();
      const raw = dataLine.replace("data:", "").trim();
      try {
        handlers.onEvent(event, JSON.parse(raw));
      } catch {
        handlers.onEvent(event, raw);
      }
    }
  }
}
