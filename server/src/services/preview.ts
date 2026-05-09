import { writeFile } from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";
import type { SessionFolders } from "../lib/storage.js";

/** 将 TS/JS 片段编译为浏览器可执行的 ESM，供内联脚本使用；失败时回退原文。 */
export async function compilePreviewScript(source: string): Promise<string> {
  try {
    const out = await esbuild.transform(source, {
      loader: "ts",
      format: "esm",
      target: "es2020",
      platform: "browser"
    });
    return out.code;
  } catch {
    return source;
  }
}

/** 渲染预览页 HTML 模板，并将生成代码以内联脚本形式注入。 */
function htmlTemplate(gameScriptSource: string): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CocosForge Preview</title>
    <style>
      body { margin: 0; background: #0f172a; color: #e2e8f0; font-family: Arial, sans-serif; }
      #app { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      canvas { border: 1px solid #334155; background: #020617; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
${gameScriptSource}
    </script>
  </body>
</html>`;
}

/** 写入策划文档并返回磁盘路径。 */
export async function writePlanningDoc(planDir: string, content: string, version: number): Promise<string> {
  const fileName = `plan-v${version}.md`;
  const filePath = path.resolve(planDir, fileName);
  await writeFile(filePath, content, "utf8");
  return filePath;
}

/** 写入 TypeScript 源码产物并返回磁盘路径。 */
export async function writeSourceCode(srcDir: string, code: string, version: number): Promise<string> {
  const fileName = `game-v${version}.ts`;
  const filePath = path.resolve(srcDir, fileName);
  await writeFile(filePath, code, "utf8");
  return filePath;
}

/** 生成并写入预览构建页面，输出构建入口文件路径。 */
export async function writePreviewBuild(
  folders: SessionFolders,
  gameScriptSource: string,
  version: number
): Promise<string> {
  const compiled = await compilePreviewScript(gameScriptSource);
  const html = htmlTemplate(compiled);
  const filePath = path.resolve(folders.buildDir, "index.html");
  await writeFile(filePath, html, "utf8");
  return filePath;
}
