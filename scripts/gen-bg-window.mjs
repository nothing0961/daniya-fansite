/**
 * 窗口背景生成脚本 — 把 /public/背景图片/*.png 生成 1600px webp 窗口版
 * 用途：聊天终端等窗口化容器显示背景，避免 10K 原图（50MB+）解码导致打开卡顿
 *
 * 运行：node scripts/gen-bg-window.mjs
 * 输出：/public/背景图片/window/<原文件名>.webp
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "public", "背景图片");
const OUT_DIR = join(SRC_DIR, "window");

const WINDOW_WIDTH = 1600; // 终端窗口最大 1200px，1600px 留 2x 余量
const QUALITY = 80;

async function main() {
  console.log("[gen-bg-window] 开始生成窗口版背景...");

  if (!existsSync(SRC_DIR)) {
    console.error(`[gen-bg-window] 源目录不存在: ${SRC_DIR}`);
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`[gen-bg-window] 创建输出目录: ${OUT_DIR}`);
  }

  const files = (await readdir(SRC_DIR))
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map((f) => join(SRC_DIR, f));

  if (files.length === 0) {
    console.warn("[gen-bg-window] 未找到图片文件");
    return;
  }

  console.log(`[gen-bg-window] 发现 ${files.length} 张图片`);

  let okCount = 0;
  let failCount = 0;

  for (const file of files) {
    const name = basename(file, extname(file));
    const outPath = join(OUT_DIR, `${name}.webp`);

    try {
      const info = await sharp(file)
        .resize({ width: WINDOW_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);

      const sizeKB = (info.size / 1024).toFixed(1);
      console.log(`  ✓ ${name}.webp  ${sizeKB}KB  ${info.width}x${info.height}`);
      okCount++;
    } catch (err) {
      console.error(`  ✗ ${name} 失败: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n[gen-bg-window] 完成: 成功 ${okCount} / 失败 ${failCount}`);
  console.log(`[gen-bg-window] 输出目录: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[gen-bg-window] 脚本异常:", err);
  process.exit(1);
});
