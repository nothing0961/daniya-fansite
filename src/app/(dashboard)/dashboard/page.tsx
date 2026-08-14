/**
 * Dashboard 首页 — /dashboard「小屋一角」
 * 用户个人中心概览：访客名牌（头像/名字/邮箱）、收藏匣+星星罐统计、账号操作、站长工具箱
 *  —— 由方案 A 整合："账号设置"与"作品管理"的入口合并到概览页
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AvatarUploadDialog } from "@/components/auth/avatar-upload-dialog";
import { EditNameDialog } from "@/components/auth/edit-name-dialog";
import { CornerStats } from "@/components/dashboard/corner-stats";
import Link from "next/link";
import "./dashboard.css";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user) return null;

  const isAdmin = user.id === process.env.ADMIN_USER_ID;

  // 统计收藏和点赞数 + 用户邮箱（基本信息展示用）
  const [bookmarkCount, likeCount, userRecord] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.postLike.count({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }, // 仅需要 email，不再查 accounts.provider
    }),
  ]);

  const email = user.email || userRecord?.email || null;
  const initials = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <div>
      {/* 眉题：小屋一角（与投稿页「小屋信箱」同源的站点语言） */}
      <p className="text-[11px] tracking-[0.3em] uppercase text-[var(--muted-foreground)] mb-1">
        ✦ 小屋一角
      </p>
      <h1 className="font-serif text-2xl font-bold tracking-wide text-[var(--foreground)] mb-6">
        个人中心
      </h1>

      {/* 访客名牌（头像 + 名称 + 邮箱 + 更换头像/编辑ID —— 原「基本信息区」已合并进来） */}
      <div className="relative flex items-center gap-4 mb-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="relative shrink-0">
          {/* 名牌角落的 Zzz（与 404 梦乡同源：访客也在小屋里打盹；绝对定位，DOM 顺序不影响视觉） */}
          <span
            aria-hidden="true"
            className="cs-zzz"
            style={{ animation: "twinkle 3s ease-in-out infinite" }}
          >
            z
          </span>
          <span
            aria-hidden="true"
            className="cs-zzz cs-zzz--2"
            style={{ animation: "twinkle 3s ease-in-out 0.6s infinite" }}
          >
            Z
          </span>
          <Avatar className="h-16 w-16 ring-2 ring-[rgba(231,155,190,0.55)] shadow-[0_0_26px_-6px_var(--primary)]">
            <AvatarImage src={user.image || undefined} alt={user.name || "用户"} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {user.name || "用户"}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {email || ""}
          </p>
        </div>
        <AvatarUploadDialog
          currentImage={user.image}
          userName={user.name}
        />
        <EditNameDialog
          currentName={user.name}
        />
      </div>

      {/* 小屋一角统计：收藏匣（可点击跳转） + 星星罐 */}
      <CornerStats bookmarkCount={bookmarkCount} likeCount={likeCount} />

      <Separator className="my-6" />

      <section>
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
          账号操作
        </h2>
        <Link
          href="/api/auth/signout"
          className="inline-flex items-center px-4 py-2 text-sm rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          退出登录
        </Link>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          轻轻带上门，下次再来打盹 ✦
        </p>
      </section>

      {/* ========== 从作品管理整合过来（站长专属快捷入口） ========== */}
      {isAdmin ? (
        <>
          <Separator className="my-10" />
          <section>
            <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
              作品管理快捷操作
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. 新增作品 */}
              <Link href="/dashboard/posts/new">
                <Card className="h-full hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      新建
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      <div>
                        <span className="text-lg font-semibold text-[var(--foreground)]">
                          新增作品
                        </span>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          MDX 编辑器 + 图床代理
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* 2. 管理作品（列表/搜索/删除/编辑） */}
              <Link href="/dashboard/posts">
                <Card className="h-full hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      列表
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zM3.75 12h.007v.008H3.75V12zM3.75 17.25h.007v.008H3.75v-.008z" />
                      </svg>
                      <div>
                        <span className="text-lg font-semibold text-[var(--foreground)]">
                          管理作品
                        </span>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          搜索 / 分页 / 状态过滤
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* 3. 投稿审核（用户投稿人工审核） */}
              <Link href="/dashboard/moderation">
                <Card className="h-full hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      审核
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-lg font-semibold text-[var(--foreground)]">
                          投稿审核
                        </span>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          PendingPost 通过/驳回
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
