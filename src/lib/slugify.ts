/**
 * 生成 slug
 *  - 保留小写英文字母、数字、连字符
 *  - 空格/下划线/中文标点/中文直接替换或去掉，以连字符连接
 *  - 首尾不能是连字符，长度 3-60 之间（否则补默认）
 */
export function slugify(input: string): string {
  const base = (input || "").toString().trim().toLowerCase()
    // 先把所有空白 / 下划线 / 中文标点、英文标点 → 连字符
    .replace(/[\s_，。！？、；：""''（）【】《》,.!?;:\-()\[\]<>\/\\]+/g, "-")
    // 只保留允许的字符
    .replace(/[^a-z0-9-]/g, "")
    // 连续连字符压缩为 1 个
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base.length >= 3 && base.length <= 60) return base;
  if (base.length > 60) return base.slice(0, 60).replace(/-+$/, "");
  // 太短（例如全是中文）→ fallback 到时间戳
  const ts = Math.floor(Date.now() / 1000).toString(36);
  return `post-${ts}`;
}

/**
 * 随机后缀，避免两个完全相同的标题生成相同 slug
 */
export function slugifyWithSuffix(input: string, saltLen = 4): string {
  const base = slugify(input);
  // 确保 base + suffix 不超过 60 字符（与 submit-post-schema SLUG_REGEX 对齐）
  const maxBase = 60 - 1 - saltLen; // 减去 '-' 和 suffix
  const trimmed = base.length > maxBase ? base.slice(0, maxBase).replace(/-+$/, "") : base;
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < saltLen; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${trimmed}-${suffix}`;
}
