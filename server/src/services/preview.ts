import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { SessionFolders } from "../lib/storage.js";

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
  const html = htmlTemplate(gameScriptSource);
  const filePath = path.resolve(folders.buildDir, "index.html");
  await writeFile(filePath, html, "utf8");
  return filePath;
}
