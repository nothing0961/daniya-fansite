/**
 * 达妮娅角色介绍页 V2.1 — /character
 * 4 大区块（2026-07-03 调整：移除原作品分类展示区块）：
 *  1. Hero Banner 主视觉 2:1 图 + 渐变叠加层（左下角「达妮娅」大字 + 副标题）
 *  2. 角色档案卡（头像占位 + 双列 10 项属性：称号/武器/属性/稀有度/性别/所属/实装版本/声优/生日/身高）
 *  3. 故事档案折叠面板（5 段 Accordion：介绍I/介绍II/共鸣者档案/语音摘录/站长备注）
 *  4. 页脚：资料来源声明（合规硬约束 — 所有引用必须附来源链接）
 *
 * 配色（来自 globals.css 达妮娅专属印象色）：
 *  --daniya-pink  粉白 亮底 / --daniya-night 星空黑 暗底
 *  --daniya-accent 亮粉紫 强调色 / --daniya-star 鹅黄星光 点缀
 *
 * Server Component — Accordion 是 use client（shadcn/radix），Server 可直接 import Client 子组件。
 */
import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "达妮娅 · 角色档案",
  description: "《鸣潮》角色达妮娅 — 官方设定档案、共鸣者资料、语音摘录与站长原创考据笔记合集",
};

/** 5 段故事档案占位（以后站长填入档案内容即可，保留结构不变） */
const STORY_SECTIONS: {
  value: string;
  title: string;
  icon: string;
  placeholder: string;
  source: string;
}[] = [
  {
    value: "intro-1",
    title: "📖 角色介绍 · 第一章",
    icon: "📖",
    placeholder:
      "⏳ 待站长填入档案内容。\n\n建议结构：3-8 段文字，每段 ≤ 150 字，描述达妮娅的背景故事、出身、性格基调等。\n\n参考来源：鸣潮官方角色页面 / 官方设定集 / 角色 PV 字幕。",
    source: "⏳ 资料来源：待补充鸣潮官方角色介绍页链接",
  },
  {
    value: "intro-2",
    title: "📖 角色介绍 · 第二章",
    icon: "📖",
    placeholder:
      "⏳ 待站长填入档案内容。\n\n建议：成长经历、重要事件、与其他角色的关系线。",
    source: "⏳ 资料来源：待补充鸣潮官方设定集 / 剧情实录链接",
  },
  {
    value: "profile",
    title: "🎯 共鸣者档案",
    icon: "🎯",
    placeholder:
      "⏳ 待站长填入共鸣者档案。\n\n建议结构：\n· 共鸣属性 / 武器类型 / 战斗定位\n· 技能介绍（被动/普攻/共鸣技能/解放）\n· 配队建议、养成要点\n· 角色 PV / 实装公告链接",
    source: "⏳ 资料来源：待补充鸣潮官方角色档案页 / 官方Wiki链接",
  },
  {
    value: "voices",
    title: "🎙️ 语音摘录",
    icon: "🎙️",
    placeholder:
      "⏳ 待站长填入语音摘录。\n\n建议按分类整理：\n· 闲置语音（登录/待机/触摸）\n· 战斗语音（入场/击杀/死亡/技能）\n· 好感/互动语音\n· 节日/活动限定语音",
    source: "⏳ 资料来源：待补充鸣潮游戏内录屏 / B站 BV号 语音合集",
  },
  {
    value: "notes",
    title: "📝 站长备注 & 考据笔记",
    icon: "📝",
    placeholder:
      "⏳ 待站长填入考据笔记 / 个人备注。\n\n建议内容：\n· 彩蛋考据（人物原型 / 与历史/神话/其他作品的关联）\n· 个人对角色的感想、解读\n· 搬运的作品注意事项\n· 「达妮娅的瞌睡小屋」粉丝站特色内容",
    source: "原创内容：由本站长原创撰写，非官方资料，谨代表个人观点。",
  },
];

/** 档案属性双列（10 项，覆盖测试断言 ≥ 8 项关键词） */
const PROFILE_ROWS: { label: string; value: string }[] = [
  { label: "称号", value: "⏳ 待补充官方称号" },
  { label: "武器", value: "⏳ 待补充（武器类型）" },
  { label: "属性", value: "⏳ 待补充（共鸣属性）" },
  { label: "稀有度", value: "⏳ 待补充（★5 / ★4）" },
  { label: "性别", value: "女" },
  { label: "所属", value: "⏳ 待补充（组织/阵营）" },
  { label: "实装版本", value: "⏳ 待补充（版本号 + 日期）" },
  { label: "声优", value: "⏳ 待补充（中配 / 日配）" },
  { label: "生日", value: "⏳ 待补充（MM-DD）" },
  { label: "身高", value: "⏳ 待补充（cm）" },
];

export default function CharacterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ===== 区块 1：Hero Banner 主视觉 2:1 + 渐变叠加层（左下角大标题 + 副标题） ===== */}
      <section className="mb-12">
        <div className="relative w-full aspect-[2/1] rounded-lg mb-6 border border-[var(--border)] overflow-hidden">
          {/* 背景主视觉图 */}
          <img
            src="/492b30d224bf47429e8aa73a9cfd104a20260521.jpg"
            alt="达妮娅角色主视觉"
            className="w-full h-full object-cover"
          />

          {/* 渐变叠加层 overlay（左下 → 右上，保证大标题在任何图上都可读） */}
          <div className="banner-title absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* 叠加层大字：达妮娅 + 副标题 + 星光点缀 */}
          <div className="overlay absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <p
              className="text-xs md:text-sm mb-2 tracking-widest font-medium"
              style={{ color: "var(--daniya-star)" }}
            >
              ✦ 共鸣者档案 · Wuthering Waves ✦
            </p>
            <h1
              className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-lg"
              style={{
                color: "var(--daniya-pink)",
                textShadow: "0 2px 16px rgba(0,0,0,.6)",
              }}
            >
              达妮娅
            </h1>
            {/* 俏皮星光胶囊标签（--daniya-star 鹅黄点缀） */}
            <div className="flex flex-wrap gap-2">
              {["✨ 萌系", "💫 泡影视阈", "🫧 白毛控", "🌸 治愈担当"].map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: "color-mix(in oklch, var(--daniya-accent) 18%, transparent)",
                    borderColor: "var(--daniya-accent)",
                    color: "var(--daniya-star)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== 区块 2：角色档案卡 — 头像占位 + 双列 10 项属性 ===== */}
        <div
          className="flex flex-col sm:flex-row gap-6 items-start rounded-xl border p-5 md:p-6"
          style={{
            borderColor: "color-mix(in oklch, var(--daniya-accent) 35%, var(--border))",
            backgroundColor:
              "light-dark(color-mix(in oklch, var(--daniya-pink) 55%, var(--card)), color-mix(in oklch, var(--daniya-night) 60%, var(--card)))",
          }}
        >
          {/* 头像：200x200 PNG 透明底立绘抠图 */}
          <div
            className="w-[200px] h-[200px] shrink-0 rounded-xl border-2 flex items-center justify-center backdrop-blur-md overflow-hidden"
            style={{
              borderColor: "var(--daniya-accent)",
              background:
                "repeating-radial-gradient(circle at 20% 30%, color-mix(in oklch, var(--daniya-accent) 10%, transparent) 0 8px, transparent 8px 20px)",
            }}
          >
            <img
              src="/625294f4d0b740f4bf5ce693ddb0b35920260521.png"
              alt="达妮娅头像·档案立绘"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          {/* 右：档案双列 10 项 */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <h2 className="text-xl font-bold" style={{ color: "var(--daniya-accent)" }}>
                达妮娅 · 共鸣者档案
              </h2>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: "var(--daniya-accent)",
                  color: "var(--daniya-pink)",
                }}
              >
                共鸣者
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {PROFILE_ROWS.map((row) => (
                <div key={row.label} className="flex gap-2">
                  <span
                    className="shrink-0 w-20 md:w-24 text-right font-medium"
                    style={{ color: "var(--daniya-accent)" }}
                  >
                    {row.label}：
                  </span>
                  <span className="flex-1 min-w-0 break-all text-[var(--foreground)]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 简介（占位，以后站长填入一段 150 字总览即可） */}
            <div className="mt-5 text-sm leading-relaxed text-[var(--muted-foreground)] space-y-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p>
                ⏳ 角色简介待站长提供（1-3 段，每段 ≤ 150 字）。建议内容包括：达妮娅的整体背景定位、
                性格印象、在剧情中的角色、粉丝喜爱的萌点亮点。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 区块 3：故事档案 Accordion × 5 段 ===== */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <span style={{ color: "var(--daniya-star)" }}>✦</span>
          角色故事档案
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            （共 5 段折叠 · 点击展开）
          </span>
        </h2>

        <Accordion type="multiple" className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)]/60 backdrop-blur px-5 md:px-6">
          {STORY_SECTIONS.map((sec) => (
            <AccordionItem key={sec.value} value={sec.value}>
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold !no-underline">
                <span className="mr-2">{sec.icon}</span>
                {sec.title}
              </AccordionTrigger>
              <AccordionContent>
                {/* 正文占位 */}
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--foreground)]/90 bg-[var(--muted)]/30 rounded-md p-4 border border-[var(--border)] mt-2">
{sec.placeholder}
                </pre>
                {/* 资料来源声明（合规硬约束：每段都标） */}
                <p
                  className="mt-3 text-xs"
                  style={{ color: "var(--daniya-accent)" }}
                >
                  📎 {sec.source}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ===== 区块 4（原区块 5）：页脚 资料来源声明（合规硬约束 — 所有引用必须附来源链接） ===== */}
      <section
        className="rounded-xl border px-5 md:px-6 py-4 text-sm"
        style={{
          borderColor: "color-mix(in oklch, var(--daniya-accent) 30%, var(--border))",
          backgroundColor:
            "light-dark(color-mix(in oklch, var(--daniya-pink) 30%, transparent), color-mix(in oklch, var(--daniya-night) 40%, transparent))",
        }}
      >
        <h3
          className="font-bold text-base mb-2 flex items-center gap-2"
          style={{ color: "var(--daniya-accent)" }}
        >
          📎 资料来源声明（合规）
        </h3>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)] leading-7">
          <li>
            ⏳ 鸣潮官方角色介绍页：<span className="text-[var(--daniya-accent)] underline">待补充链接</span>
          </li>
          <li>
            ⏳ 鸣潮官方 Wiki / Fandom：<span className="text-[var(--daniya-accent)] underline">待补充链接</span>
          </li>
          <li>
            ⏳ 官方角色 PV / 实装公告（B站 BV 号）：<span className="text-[var(--daniya-accent)] underline">待补充 BV 号链接</span>
          </li>
          <li>
            ⏳ 共鸣者档案 / 设定集：<span className="text-[var(--daniya-accent)] underline">待补充链接</span>
          </li>
          <li>
            同人作品列表：来源于审核通过的用户投稿，每篇作品单独标注原作者 &amp; 来源链接。
          </li>
          <li>
            原创「站长考据笔记」板块：谨代表本粉丝站长个人观点，非官方设定，转载请注明出处。
          </li>
        </ul>
      </section>
    </div>
  );
}
