import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "注册",
  description: "注册达妮娅的瞌睡小屋账号",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">注册</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            注册后可以使用全部功能
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-sm text-center text-[var(--muted-foreground)]">
          已有账号？{" "}
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
