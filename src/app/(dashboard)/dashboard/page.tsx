/**
 * Dashboard 首页 — /dashboard
 * 用户个人中心概览：用户信息、收藏/点赞统计、账号设置（基本信息+更换头像+退出）、站长快捷操作
 *  —— 由方案 A 整合："账号设置"与"作品管理"的入口合并到概览页
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AvatarUploadDialog } from "@/components/auth/avatar-upload-dialog";
import { EditNameDialog } from "@/components/auth/edit-name-dialog";
import Link from "next/link";

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
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        个人中心
      </h1>

      {/* 用户信息卡片（头像 + 名称 + 邮箱 + 更换头像按钮 —— 原「基本信息区」已合并进来，避免两处重复展示头像昵称） */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image || undefined} alt={user.name || "用户"} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
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

      {/* 统计卡片：收藏（可点击跳转） + 点赞 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/bookmarks">
          <Card className="hover:border-[var(--primary)]/30 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <span className="text-sm text-[var(--muted-foreground)]">
                我的收藏
              </span>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-[var(--foreground)]">
                {bookmarkCount}
              </span>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm text-[var(--muted-foreground)]">
              我的点赞
            </span>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-[var(--foreground)]">
              {likeCount}
            </span>
          </CardContent>
        </Card>
      </div>

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
                    <span className="text-lg font-semibold text-[var(--foreground)]">
                      新增作品
                    </span>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      MDX 编辑器 + 图床代理
                    </p>
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
                    <span className="text-lg font-semibold text-[var(--foreground)]">
                      管理作品
                    </span>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      搜索 / 分页 / 状态过滤
                    </p>
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
                    <span className="text-lg font-semibold text-[var(--foreground)]">
                      投稿审核
                    </span>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      PendingPost 通过/驳回
                    </p>
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
