import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "达妮娅 · 角色档案",
  description:
    "《鸣潮》角色达妮娅 — 官方设定档案、共鸣者资料、语音摘录与站长原创考据笔记合集",
};

export default function CharacterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
