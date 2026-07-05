"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import { Captcha, type CaptchaHandle } from "./captcha";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const captchaRef = useRef<CaptchaHandle>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNotRegistered, setShowNotRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("请填写用户名和密码");
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
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "USER_NOT_REGISTERED") {
          // 未注册用户 → 弹 Dialog，只能点"确认"或右上角X 关闭，不跳转不显示红色错误条
          setShowNotRegistered(true);
          captchaRef.current?.refresh();
          setCaptchaInput("");
        } else {
          setError(result.error === "CredentialsSignin" ? "用户名或密码错误" : result.error);
          captchaRef.current?.refresh();
          setCaptchaInput("");
        }
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
    <>
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="用户名"
        required
        autoFocus
        className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
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
          onChange={(e) => setCaptchaInput(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="验证码"
          maxLength={4}
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
        {loading ? "登录中..." : "登录"}
      </button>
    </form>

    {/* 未注册用户登录 → 专属 Dialog，只能点『确认』或右上角 X 关闭 */}
    <Dialog
      open={showNotRegistered}
      onOpenChange={(next) => {
        if (next) setShowNotRegistered(true);
        // next === false 方向直接丢弃：点遮罩 / 按 Esc 均无法关闭
      }}
    >
      <DialogContent>
        {/* 右上角关闭叉（仅点击触发，不依赖 Dialog 默认 close）*/}
        <button
          type="button"
          onClick={() => setShowNotRegistered(false)}
          aria-label="关闭"
          className="absolute top-4 right-4 p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <DialogTitle className="pr-8">温馨提示</DialogTitle>
        <DialogDescription className="pt-3">
          该用户未注册
        </DialogDescription>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => setShowNotRegistered(false)}
          >
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
