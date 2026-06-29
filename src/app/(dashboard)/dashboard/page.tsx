/**
 * Dashboard 首页 — /dashboard
 * 用户个人中心概览：用户名、头像、收藏数、点赞数
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user) return null;

  // 统计收藏和点赞数 + 账号绑定信息
  const [bookmarkCount, likeCount, userRecord] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.postLike.count({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        phone: true,
        accounts: { select: { provider: true } },
      },
    }),
  ]);

  const linkedProviders = new Set(userRecord?.accounts?.map((a) => a.provider) || []);
  const linkedMethods = [
    { key: "github", label: "GitHub", linked: linkedProviders.has("github"), icon: null },
    { key: "qq", label: "QQ", linked: linkedProviders.has("qq"), icon: null },
    { key: "email", label: "邮箱", linked: !!userRecord?.email, icon: null },
    { key: "phone", label: "手机", linked: !!userRecord?.phone, icon: null },
  ];

  const initials = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        个人中心
      </h1>

      {/* 用户信息卡片 */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image || undefined} alt={user.name || "用户"} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {user.name || "用户"}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {user.email || ""}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/bookmarks">
          <Card className="hover:border-[var(--primary)]/30 transition-colors cursor-pointer">
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

      {/* 账号绑定 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
          绑定账号
        </h3>
        <div className="space-y-2">
          {linkedMethods.map((m) => (
            <div
              key={m.key}
              className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] bg-[var(--card)]"
            >
              <span className="text-sm text-[var(--foreground)]">{m.label}</span>
              <span
                className={`text-xs ${
                  m.linked
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {m.linked ? "已绑定" : "未绑定"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
