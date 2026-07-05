"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { Captcha, type CaptchaHandle } from "./captcha";

const USERNAME_RE = /^[\w一-鿿]{2,10}$/;
const CODE_LEN = 4;

export function RegisterForm() {
  const captchaRef = useRef<CaptchaHandle>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!USERNAME_RE.test(username)) {
      setError("用户名需为 2-10 个字符，仅支持中文、英文、数字、下划线");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (captchaInput.toUpperCase() !== captchaCode.toUpperCase()) {
      setError("验证码错误");
      captchaRef.current?.refresh();
      setCaptchaInput("");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "注册失败");
        captchaRef.current?.refresh();
        setCaptchaInput("");
        return;
      }

      // 注册成功，自动登录
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("注册成功但自动登录失败，请手动登录");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="用户名（2-10个字符）"
        maxLength={10}
        required
        autoFocus
        className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码（至少6位）"
        required
        className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />

      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="确认密码"
        required
        className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />

      <div className="flex items-center gap-3">
        <Captcha
          ref={captchaRef}
          onChange={setCaptchaCode}
        />
        <input
          type="text"
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value.toUpperCase().slice(0, CODE_LEN))}
          placeholder="验证码"
          maxLength={CODE_LEN}
          required
          className="flex-1 h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-center tracking-widest text-lg"
        />
      </div>

      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-md bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "注册中..." : "注册"}
      </button>
    </form>
  );
}
