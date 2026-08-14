import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "登录",
  description: "登录达妮娅的瞌睡小屋",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthShell
      title="登录"
      subtitle="登录后可以使用全部功能"
      footer={
        <>
          还没有账号？{" "}
          <Link href="/login/register" className="text-[var(--primary)] hover:underline">
            去注册
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
