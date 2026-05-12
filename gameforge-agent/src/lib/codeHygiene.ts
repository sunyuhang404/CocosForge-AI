/** 去掉 UTF-8 BOM，统一换行为 LF。 */
export function normalizeSourceText(source: string): string {
  return source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}

/**
 * 去掉首尾 Markdown 代码围栏（``` / ```ts / ```typescript 等）。
 * 模型偶发包裹代码块，直接嵌入 `<script type="module">` 会报错。
 */
export function stripMarkdownCodeFence(source: string): string {
  let s = normalizeSourceText(source).trim();
  const wrapped = /^```(?:typescript|ts|javascript|js|jsx|tsx)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/;
  const m = s.match(wrapped);
  if (m) return m[1].trim();

  if (s.startsWith("```")) {
    const firstNl = s.indexOf("\n");
    const lastFence = s.lastIndexOf("```");
    if (firstNl !== -1 && lastFence > firstNl) {
      const inner = s.slice(firstNl + 1, lastFence).trim();
      if (inner) return inner;
    }
  }
  return s;
}

/** 生成链路通用：围栏剥离 + 规范化。 */
export function sanitizeGeneratedGameCode(raw: string): string {
  return stripMarkdownCodeFence(raw);
}
