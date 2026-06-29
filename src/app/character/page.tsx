/**
 * 达妮娅角色介绍页 — /character
 * 展示角色基本信息、立绘、背景介绍
 * 人物相关内容待站长确认后填入
 *
 * 修改方式：修改 characterInfo 对象中的文字内容
 * 替换图片时，将占位 div 替换为 <img> 标签
 */
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { FeedList } from "@/components/feed/feed-list";

export const metadata: Metadata = {
  title: "达妮娅",
  description: "《鸣潮》角色达妮娅的介绍与同人二创作品合集",
};

export default function CharacterPage() {
  // 获取所有与达妮娅相关的作品
  const allPosts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ===== 角色信息区 ===== */}
      <section className="mb-12">
        {/* [图片占位] 角色 Hero Banner — 1200×600, 2:1 */}
        <div className="w-full aspect-[2/1] rounded-lg bg-[var(--muted)] flex items-center justify-center mb-8 border border-[var(--border)]">
          <span className="text-[var(--muted-foreground)] text-sm">
            1200 × 600 — 达妮娅角色主视觉 (2:1)
          </span>
        </div>

        {/* 角色基本信息卡片 */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* [图片占位] 角色头像 — 200×200, 1:1 */}
          <div className="w-[200px] h-[200px] rounded-lg bg-[var(--muted)] flex items-center justify-center border border-[var(--border)] shrink-0">
            <span className="text-[var(--muted-foreground)] text-sm text-center">
              200 × 200<br />达妮娅头像 (1:1)
            </span>
          </div>

          {/* 角色文字信息 */}
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              达妮娅
            </h1>
            <p className="text-sm text-[var(--primary)] mb-4">
              鸣潮 · Wuthering Waves
            </p>

            {/*
              角色简介 — ⏳ 待站长提供
              修改这里可填入达妮娅的背景故事、性格特点等信息
            */}
            <div className="space-y-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
              <p>
                ⏳ 角色简介待站长提供。请在这里填写达妮娅的背景故事、性格特点、
                游戏中的定位等信息。
              </p>
              <p>
                目前这个区域是占位文字。你可以根据官方资料或自己的理解来补充内容。
              </p>
            </div>

            {/* 角色属性标签 — 待确认后修改 */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {["鸣潮", "共鸣者", "待补充"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--foreground)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 相关二创作品 ===== */}
      <section>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
          二创作品
          <span className="ml-2 text-base font-normal text-[var(--muted-foreground)]">
            ({allPosts.length} 篇)
          </span>
        </h2>

        <FeedList posts={allPosts} />

        {allPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[var(--muted-foreground)]">
              暂无作品，敬请期待
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
