/**
 * CornerStats — 小屋一角统计：收藏匣 + 星星罐
 * 收藏数 = 一只小匣子（hover 开盖，点击进收藏页）
 * 点赞数 = 一只星星罐（罐内星光闪烁）
 * 数字用 CountUp 滚动；0 时为空状态邀请文案
 */
"use client";

import Link from "next/link";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";

interface CornerStatsProps {
  bookmarkCount: number;
  likeCount: number;
}

export function CornerStats({ bookmarkCount, likeCount }: CornerStatsProps) {
  return (
    <div className="cs-grid">
      <Reveal delay={0.05}>
        <Link href="/dashboard/bookmarks" className="cs-object cs-object--link">
          <div className="cs-chest" aria-hidden="true">
            <span className="cs-chest-lid" />
            <span className="cs-chest-body">
              <span className="cs-chest-key" />
              <span className="cs-chest-count">
                <CountUp value={String(bookmarkCount)} />
              </span>
            </span>
          </div>
          <p className="cs-object-label">我的收藏</p>
          <p className="cs-object-hint">
            {bookmarkCount > 0 ? "打开匣子看看" : "匣子还空着，去首页逛逛吧？"}
          </p>
        </Link>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="cs-object">
          <div className="cs-jar" aria-hidden="true">
            <span className="cs-jar-star cs-jar-star--1">✦</span>
            <span className="cs-jar-star cs-jar-star--2">✦</span>
            <span className="cs-jar-star cs-jar-star--3">✦</span>
            <span className="cs-jar-count">
              <CountUp value={String(likeCount)} />
            </span>
          </div>
          <p className="cs-object-label">我的点赞</p>
          <p className="cs-object-hint">
            {likeCount > 0 ? "罐子里装满星光" : "还没有星星，给喜欢的作品点个赞吧"}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
