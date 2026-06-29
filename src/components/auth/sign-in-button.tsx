/**
 * SignInButton — 登录按钮
 * 点击跳转到 /login 页面
 */
import Link from "next/link";

export function SignInButton() {
  return (
    <Link
      href="/login"
      className="ml-1 px-3 py-1.5 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
    >
      登录
    </Link>
  );
}
