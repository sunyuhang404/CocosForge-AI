import "../config.js";
import { rebuildVectorIndex } from "../services/ingest.js";

// 传入 --force 时强制重建向量索引。
const force = process.argv.includes("--force");

/** 命令行脚本入口：重建知识库向量索引并输出结果。 */
rebuildVectorIndex(force)
  .then((result) => {
    console.log(
      `[ingest] done, changed=${result.changed ? "yes" : "no"}, sources=${result.count}`
    );
  })
  .catch((error) => {
    console.error("[ingest] failed:", error);
    process.exit(1);
  });
