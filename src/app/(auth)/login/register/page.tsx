import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "注册",
  description: "注册达妮娅的瞌睡小屋账号",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthShell
      title="注册"
      subtitle="注册后可以使用全部功能"
      footer={
        <>
          已有账号？{" "}
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            去登录
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
