/**
 * 登录页 — /login
 * 支持：GitHub OAuth / QQ OAuth / 邮箱 Magic Link / 手机验证码
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";
import { LoginTabs } from "./login-tabs";

export const metadata: Metadata = {
  title: "登录",
  description: "登录达妮娅的瞌睡小屋",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            登录
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            登录后可以使用收藏和点赞功能
          </p>
        </div>

        {/* OAuth 按钮 */}
        <OAuthButtons />

        {/* 分割线 */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
            或使用邮箱 / 手机登录
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Tab 切换 + 登录表单 */}
        <LoginTabs
          emailForm={<EmailLoginForm />}
          phoneForm={<PhoneLoginForm />}
        />

        <p className="mt-6 text-xs text-center text-[var(--muted-foreground)]">
          登录即表示同意本站的隐私政策。
          本站仅获取你的公开信息（用户名、头像）。
        </p>
      </div>
    </div>
  );
}
