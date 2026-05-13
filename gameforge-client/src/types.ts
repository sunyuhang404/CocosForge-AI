export type SessionStatus = "PLANNING" | "DEVELOPING" | "DONE";

export type SessionItem = {
  id: string;
  name: string;
  status: SessionStatus;
  rootDir: string;
  createdAt: string;
  userId?: string;
};

export type MessageItem = {
  id?: string;
  sessionId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

export type DynamicFormField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required: boolean;
  options?: Array<{ label: string; value: string }>;
};

export type DynamicFormSchema = {
  title: string;
  description: string;
  fields: DynamicFormField[];
};
