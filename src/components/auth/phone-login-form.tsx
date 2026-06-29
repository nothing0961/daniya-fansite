"use client";

import { useState, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";

export function PhoneLoginForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const startCountdown = useCallback(() => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  async function handleSendCode() {
    if (!phone || countdown > 0) return;

    const phoneRe = /^1[3-9]\d{9}$/;
    if (!phoneRe.test(phone)) {
      setError("请输入有效的手机号");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }

      setCodeSent(true);
      startCountdown();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSending(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !code) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn("phone", {
        phone,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError("验证码错误或已过期");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-3">
      {/* 手机号输入 */}
      <div className="flex gap-2">
        <span className="flex items-center h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--muted-foreground)] whitespace-nowrap">
          +86
        </span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setCodeSent(false);
            setError("");
          }}
          placeholder="请输入手机号"
          maxLength={11}
          required
          className="flex-1 h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* 发送验证码按钮 */}
      {!codeSent ? (
        <button
          type="button"
          onClick={handleSendCode}
          disabled={sending || !phone || countdown > 0}
          className="w-full h-10 rounded-md bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          {sending ? "发送中..." : "发送验证码"}
        </button>
      ) : (
        <div className="space-y-3">
          {/* 验证码输入 */}
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="请输入6位验证码"
            maxLength={6}
            required
            autoFocus
            className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-center tracking-widest text-lg"
          />

          <div className="flex gap-2">
            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 h-10 rounded-md bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>

            {/* 重新发送 */}
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || sending}
              className="h-10 px-4 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {countdown > 0 ? `${countdown}s` : "重新发送"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-[var(--destructive)]">{error}</p>
      )}
    </form>
  );
}
