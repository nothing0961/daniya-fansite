import { auth } from "@/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarUploadDialog } from "@/components/auth/avatar-upload-dialog";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) return null;

  const initials = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        账号设置
      </h1>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
          基本信息
        </h2>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || undefined} alt={user.name || ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {user.name || "未知用户"}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {user.email || "无邮箱"}
              </p>
            </div>
            <AvatarUploadDialog
              currentImage={user.image}
              userName={user.name}
            />
          </div>
        </div>
      </section>

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
    </div>
  );
}
