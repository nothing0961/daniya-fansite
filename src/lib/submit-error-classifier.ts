/**
 * 方案 A-1 · 错误分级映射（用户投稿 / 管理后台发布 通用）
 *
 * 按 "用户能看懂 & 能自己解决" 分 3 级：
 *  🟢 用户级操作错误（~80%）：显示具体错误（用户看了就知道改什么）
 *  🟡 半系统级半操作错误（~15%）：显示具体错误（用户部分能解决）
 *  🔴 纯系统级（<5%）：隐藏技术细节，给通用人话（联系站长 / 稍后再试）
 *
 * 返回结构：
 *  {
 *    summary: string;     // 人类能看懂的 1 句话总结（弹窗标题已用"提交失败"，这里给 detail 用）
 *    detail?: string;     // 具体原因为可解决的给出；系统级不给技术栈原文
 *    level: "green" | "yellow" | "red";
 *  }
 */

/** 🟢 用户级关键词（占 ~80% 错误，用户能看懂能解决） */
const GREEN_KEYWORDS: Array<[RegExp, string?]> = [
  [/标题.*(空|不能|不超过)/],
  [/简介.*(空|不能|不超过)/],
  [/BV.*(号|格式|不正|必须以 BV 开头)/i],
  [/标签.*(最多|数量|空)/],
  [/(插画|截图).*至少.*(上传|1).*图片/],
  [/视频.*BV/],
  [/slug.*(存在|格式|不正|重复)/i],
  [/slug 只能包含/],
  [/今日.*(上传|用|张)/],
  [/(每用户|全站).*每日.*(张|限)/],
  [/(额度|限额|次数)/],
  [/ImgURL/i, "具体"], // ImgURL 额度 / 格式用户看了能解决
  [/文件.*(大|大小|超过|MB)/i],
  [/图片.*(格式|类型|不支持)/i],
  [/未登录|请重新登录|未认证/i],
  [/作者昵称|来源平台|来源链接/],
];

/** 🟡 半系统级（~15%，给用户看到底是 "网络" 还是 "服务器返回异常格式"，让他判断是重填还是刷新） */
const YELLOW_KEYWORDS: Array<[RegExp, string?]> = [
  [/网络|offline|fetch|Failed to fetch|CORS|timeout/i],
  [/解析失败|解析错误|JSON|格式不正确/i],
  [/未找到|404|413|419|422/i],
];

/** 🔴 纯系统级（<5%，用户完全看不懂也解决不了 — 隐藏技术细节给通用话） */
const RED_KEYWORDS: Array<[RegExp]> = [
  [/Prisma/i],
  [/Neon/i],
  [/database|db\s/i],
  [/数据库|写入失败|插入失败|duplicate|unique.*constraint/i],
  [/500|internal server|server error|上游服务器/i],
  [/ImgToken|token.*失效|invalid token|凭证/i],
  [/Unexpected token/i],
  [/TypeError|ReferenceError|RangeError/],
  [/连接池|connection|pool/i],
  [/E11000|MongoError/], // 防未来换数据库
  [/Rate limit exceeded.*server/i],
];

export interface ClassifiedError {
  /** 给弹窗最外层用的人类总结话（1 句） */
  summary: string;
  /** 给弹窗红色 detail 框显示的详细原因：🟢🟡=具体；🔴=通用，不暴露技术 */
  detail?: string;
  /** 分级 */
  level: "green" | "yellow" | "red";
}

/**
 * 把后端 / 前端抓到的任意 error 字符串，分级成人类友好的结果
 *
 * @param rawError 后端返回的 err.error / message / data.msg，或前端 catch 的 "保存失败，请检查网络" 等
 * @returns ClassifiedError
 */
export function classifySubmitError(rawError: unknown): ClassifiedError {
  const str = typeof rawError === "string"
    ? rawError
    : rawError && typeof rawError === "object" && "message" in rawError && typeof (rawError as { message?: unknown }).message === "string"
      ? (rawError as { message: string }).message
      : String(rawError ?? "未知错误");

  const s = str.trim();

  // 🔴 系统级匹配（先做：防止关键词中同时出现用户级词被误分类到 green）
  for (const [re] of RED_KEYWORDS) {
    if (re.test(s)) {
      return {
        level: "red",
        summary: "系统维护中，请稍后再试",
        detail:
          "服务器遇到了意料之外的问题，站长已收到告警正在处理。" +
          "若问题持续存在，请稍后再尝试提交；或直接联系站长反馈 🙏",
      };
    }
  }

  for (const [re, _hint] of GREEN_KEYWORDS) {
    if (re.test(s)) {
      return {
        level: "green",
        summary: buildGreenSummary(s),
        detail: s || "您的内容填写有误，请修改后重试",
      };
    }
  }

  for (const [re] of YELLOW_KEYWORDS) {
    if (re.test(s)) {
      return {
        level: "yellow",
        summary: buildYellowSummary(s),
        detail: s, // 保留原文，用户可能认识 "网络" / "timeout" 这类
      };
    }
  }

  // 默认兜底：不认识的错误 → 按 yellow 处理（给具体原文，至少用户能复制给站长）
  return {
    level: "yellow",
    summary: "提交失败，请再检查",
    detail: s || "未知错误，请稍后重试",
  };
}

function buildGreenSummary(s: string): string {
  if (/今日|每日|额度|限额|限流|上传.*(张|用)/.test(s)) return "上传额度已用完";
  if (/标题|简介|标签|BV.*号|配图|插画|截图|视频|slug/i.test(s)) return "您的内容填写有误";
  if (/文件|大小|图片.*格式|格式不正/i.test(s)) return "上传的图片不符合要求";
  if (/未登录|请重新登录/i.test(s)) return "登录已过期";
  return "您的内容填写有误";
}

function buildYellowSummary(s: string): string {
  if (/网络|fetch|timeout|offline|CORS/i.test(s)) return "网络连接不太稳定";
  if (/解析|JSON|422|419|413/i.test(s)) return "提交的数据格式异常";
  return "提交过程中出现异常";
}
