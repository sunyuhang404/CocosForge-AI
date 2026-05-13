/** 与后端 SSE `codegen_progress.stage` 对齐的简短中文标签（无 detail 时兜底）。 */
export const CODEGEN_STAGE_LABELS: Record<string, string> = {
  planning: "生成策划案",
  codegen: "生成代码",
  validate: "AI 校验脚本",
  codegen_retry: "校验未通过，重新生成",
  build: "生成预览页面",
  done: "完成"
};

export function codegenProgressLabel(stage: string | undefined, detail?: string): string {
  if (detail?.trim()) return detail.trim();
  if (!stage) return "处理中";
  return CODEGEN_STAGE_LABELS[stage] ?? stage;
}
