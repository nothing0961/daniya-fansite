/**
 * 关于本站 — /about
 * 站点介绍、搬运说明、联系方式
 *
 * 修改方式：直接修改 JSX 中的文字内容
 */
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "关于本站",
  description: "关于达妮娅的瞌睡小屋 — 站点介绍与搬运说明",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        关于本站
      </h1>

      <div className="space-y-6 text-sm text-[var(--muted-foreground)] leading-relaxed">
        {/* 站长寄语 */}
        <section className="italic text-[var(--foreground)] space-y-4 leading-relaxed border-l-2 border-[var(--primary)] pl-4">
          <h2 className="text-lg font-semibold not-italic">关于这座小站</h2>
          <p>
            版本更迭，聚光灯总会转向新的面孔。
            那些曾经刷屏的切片、二创、热烈讨论，会随着时间慢慢沉淀到时间线的深处。
          </p>
          <p>
            但我不愿看到达妮娅就此消失在虚质空间的尘埃里。
            那个粉白渐变长发的女孩，那个戴着锁链项圈、眼神里藏着决绝与孤独的实验体，不该被遗忘在版本更新的夹缝中。
            所以有了这座小站。
          </p>
          <p>
            这里只做一件事：把网上那些好看的、动人的、用心的达妮娅二创，一张张、一件件地收集起来。
            无论是插画、漫画、视频，还是COS，只要足够优质，我都会搬运到这里，标注好每一位原作者的署名与出处。
          </p>
          <p>
            或许这座小站永远只是同人圈里一个安静的角落，
            但只要还有人点进来，看到娅娅在虚质空间里不是孤身一人——
            那就够了。
          </p>
          <p className="text-right">
            —— 献给达妮娅，献给所有还在记得她的人
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            这是什么网站？
          </h2>
          <p>
            达妮娅的瞌睡小屋是一个专注于《鸣潮》角色「达妮娅」的同人二创作品 curation 站点。
            站长精选搬运来自微博、Pixiv、Lofter、B站、小红书等平台的优质二创内容，
            包括插画、漫画、COS、文章等多种类型。
          </p>
          <p className="mt-2">
            本站的初衷是汇聚分散在各个平台的优秀达妮娅二创作品，
            方便喜爱这个角色的同好们发现和欣赏。
          </p>
        </section>

        <Separator />

        {/* 搬运说明 */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            关于版权
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              本站所有二创作品的版权归<b>原作者</b>所有。
            </li>
            <li>
              每篇作品均标注原作者昵称、来源平台和原帖链接。
            </li>
            <li>
              本站不声称对任何作品拥有权利，仅做 curation 展示。
            </li>
            <li>
              如您是原作者且不希望作品被收录，请联系站长，会立即下架处理。
            </li>
          </ul>
        </section>

        <Separator />

        {/* 联系方式 — 待站长填写 */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            联系方式
          </h2>
          <p>
            {/* 可填：微博 / GitHub / 邮箱 / Discord 等 */}
            GitHub：<a href="https://github.com/nothing0961" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">nothing0961</a>
            <br />B站: <a href="https://space.bilibili.com/272000701" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">达妮娅的大黑猫</a>
            <br />邮箱&nbsp;:&nbsp;2994236958@qq.com
          </p>
        </section>

        <Separator />

        {/* 技术栈 */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            技术栈
          </h2>
          <p>本站使用以下技术构建：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Next.js 16 — React 全栈框架</li>
            <li>Tailwind CSS v4 — 原子化 CSS</li>
            <li>MDX — 内容管理</li>
            <li>Auth.js v5 — 用户认证</li>
            <li>Giscus — 评论系统</li>
            <li>Vercel — 部署平台</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
