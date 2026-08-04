/**
 * 首页数据 — 角色档案、能力标签、对话摘录、共鸣图鉴、站长笔记、统计数据
 */

export interface EchoQuote {
  id: string;
  text: string;
  source: string;
}

export interface AbilityTag {
  label: string;
  emoji: string;
  tone: "gold" | "pink" | "blue" | "green";
}

export interface SideNote {
  id: string;
  title: string;
  excerpt: string;
  time: string;
}

export interface StatItem {
  label: string;
  value: string;
  sub: string;
}

export const HERO_DATA = {
  titleZh: "达妮娅",
  titleEn: "D A N I Y A",
  subtitle: "共鸣者档案 · 星炬学院在籍",
  description:
    "经常有人问我为什么不穿校服……校服是提供虚质防护的对吧？但我在学院登记的共鸣能力就是『制造隔绝虚质、提供防护的泡泡』呀？哈哈哈，是不是很意外。",
  quote:
    "「课题迷茫时只要带甜点 + 软磨硬泡多说几句好话，她就帮你『蒙对』正确方向。」",
  ctaPrimary: { label: "进入档案", href: "/character" },
  ctaSecondary: { label: "查看作品", href: "/works" },
};

export const ABILITY_TAGS: AbilityTag[] = [
  { label: "泡泡共鸣", emoji: "🫧", tone: "blue" },
  { label: "虚质隔绝", emoji: "🛡️", tone: "gold" },
  { label: "甜点狂魔", emoji: "🍰", tone: "pink" },
  { label: "瞌睡少女", emoji: "💤", tone: "green" },
  { label: "泡泡爆破", emoji: "💥", tone: "gold" },
];

export const ECHO_QUOTES: EchoQuote[] = [
  {
    id: "q1",
    text: "哎呀……甜点给我，我就告诉你。别用那种眼神看我啦！",
    source: "闲置语音",
  },
  {
    id: "q2",
    text: "泡泡会保护大家的，嗯……大概吧。",
    source: "战斗入场",
  },
  {
    id: "q3",
    text: "今天的课……应该、大概、也许……可以睡一会儿。",
    source: "待机状态",
  },
];

export const RESONANCE_TAGS = [
  { label: "频谱稳定", active: true },
  { label: "共鸣等级", value: "C-Rank" },
  { label: "超频风险", value: "正常" },
  { label: "适格资质", value: "待评估" },
];

export const SIDE_NOTES: SideNote[] = [
  {
    id: "n1",
    title: "关于泡泡的真实来历",
    excerpt: "据本人说法，泡泡装置是从鸣呜物流邮购的。但实测防护性能远超广告描述……",
    time: "2 小时前",
  },
  {
    id: "n2",
    title: "星炬学院考勤异常报告",
    excerpt: "本月累计翘课 23 次，但共鸣成绩稳居 A+。讲师们对此表示非常困惑。",
    time: "昨天",
  },
];

export const STAT_ITEMS: StatItem[] = [
  { label: "站内访客", value: "23,461", sub: "累计" },
  { label: "共鸣图鉴", value: "8", sub: "已收录" },
  { label: "甜点库存", value: "∞", sub: "永远吃不完" },
  { label: "超频记录", value: "0", sub: "安全" },
];
