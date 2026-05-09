/** 护栏检查统一返回结构，决定聊天流程走向。 */
export type GuardrailResult =
  | { status: "blocked"; reason: string; reply: string }
  | { status: "needs_more_info"; missingFields: string[]; form: DynamicFormSchema }
  | { status: "pass"; summary: string; isGameRelated: true };

/** 动态表单字段定义，用于向用户追问缺失信息。 */
export type DynamicFormField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

/** 动态表单结构，供前端直接渲染。 */
export type DynamicFormSchema = {
  title: string;
  description: string;
  fields: DynamicFormField[];
};

/** 会话消息结构体。 */
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/** 聊天接口请求体。 */
export type ChatRequestBody = {
  sessionId: string;
  message: string;
  formAnswers?: Record<string, string | number>;
};

/** 会话状态枚举。 */
export type SessionStatus = "PLANNING" | "DEVELOPING" | "DONE";

/** SSE 事件名到事件负载结构的映射。 */
export type SseEventPayloadMap = {
  guardrail_result: { status: GuardrailResult["status"]; detail?: string };
  question_form: DynamicFormSchema;
  planning_chunk: { chunk: string };
  codegen_progress: { stage: string; percent: number; detail?: string };
  preview_ready: { previewUrl: string; version: number };
  error: { message: string };
};
