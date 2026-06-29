"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn("nodemailer", {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError("发送失败，请稍后重试");
      } else {
        setSent(true);
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--foreground)] mb-2">
          登录链接已发送
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          请检查邮箱 <span className="font-medium text-[var(--foreground)]">{email}</span>，点击邮件中的链接完成登录
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--destructive)]">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-md bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "发送中..." : "发送登录链接"}
      </button>
    </form>
  );
}
