/**
 * 桌面背景生成脚本 — 把 /public/背景图片/*.png 生成 3840px 4K webp 桌面版
 * 用途：全屏背景使用桌面版，避免 10K 原图（50MB+）解码导致切换/首屏卡顿
 *
 * 运行：node scripts/gen-bg-desktop.mjs
 * 输出：/public/背景图片/desktop/<原文件名>.webp
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "public", "背景图片");
const OUT_DIR = join(SRC_DIR, "desktop");

const DESKTOP_WIDTH = 3840; // 4K，覆盖绝大多数显示器
const QUALITY = 82;

async function main() {
  console.log("[gen-bg-desktop] 开始生成桌面版背景...");

  if (!existsSync(SRC_DIR)) {
    console.error(`[gen-bg-desktop] 源目录不存在: ${SRC_DIR}`);
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`[gen-bg-desktop] 创建输出目录: ${OUT_DIR}`);
  }

  const files = (await readdir(SRC_DIR))
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map((f) => join(SRC_DIR, f));

  if (files.length === 0) {
    console.warn("[gen-bg-desktop] 未找到图片文件");
    return;
  }

  console.log(`[gen-bg-desktop] 发现 ${files.length} 张图片`);

  let okCount = 0;
  let failCount = 0;

  for (const file of files) {
    const name = basename(file, extname(file));
    const outPath = join(OUT_DIR, `${name}.webp`);

    try {
      const info = await sharp(file)
        .resize({ width: DESKTOP_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);

      const sizeMB = (info.size / 1024 / 1024).toFixed(2);
      console.log(`  ✓ ${name}.webp  ${sizeMB}MB  ${info.width}x${info.height}`);
      okCount++;
    } catch (err) {
      console.error(`  ✗ ${name} 失败: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n[gen-bg-desktop] 完成: 成功 ${okCount} / 失败 ${failCount}`);
  console.log(`[gen-bg-desktop] 输出目录: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[gen-bg-desktop] 脚本异常:", err);
  process.exit(1);
});
