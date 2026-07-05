import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

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
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">登录</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            登录后可以使用全部功能
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-sm text-center text-[var(--muted-foreground)]">
          还没有账号？{" "}
          <Link href="/login/register" className="text-[var(--primary)] hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
