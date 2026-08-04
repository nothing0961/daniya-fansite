/**
 * 缩略图生成脚本 — 把 /public/背景图片/*.png 生成 480px webp 缩略图
 * 用途：BgSwitcher 下拉菜单使用缩略图，避免 10K 原图导致卡顿
 *
 * 运行：node scripts/gen-bg-thumbs.mjs
 * 输出：/public/背景图片/thumbs/<原文件名>.webp
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "public", "背景图片");
const OUT_DIR = join(SRC_DIR, "thumbs");

const THUMB_WIDTH = 480; // 2x 高清屏适配（CSS 显示 240px）
const QUALITY = 78;

async function main() {
  console.log("[gen-bg-thumbs] 开始生成缩略图...");

  if (!existsSync(SRC_DIR)) {
    console.error(`[gen-bg-thumbs] 源目录不存在: ${SRC_DIR}`);
    process.exit(1);
  }

  // 创建输出目录
  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`[gen-bg-thumbs] 创建输出目录: ${OUT_DIR}`);
  }

  // 读取所有 png 文件
  const files = (await readdir(SRC_DIR))
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map((f) => join(SRC_DIR, f));

  if (files.length === 0) {
    console.warn("[gen-bg-thumbs] 未找到图片文件");
    return;
  }

  console.log(`[gen-bg-thumbs] 发现 ${files.length} 张图片`);

  let okCount = 0;
  let failCount = 0;

  for (const file of files) {
    const name = basename(file, extname(file));
    const outPath = join(OUT_DIR, `${name}.webp`);

    try {
      const info = await sharp(file)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
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

  console.log(`\n[gen-bg-thumbs] 完成: 成功 ${okCount} / 失败 ${failCount}`);
  console.log(`[gen-bg-thumbs] 输出目录: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[gen-bg-thumbs] 脚本异常:", err);
  process.exit(1);
});
