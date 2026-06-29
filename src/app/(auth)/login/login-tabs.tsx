"use client";

import { useState, type ReactNode } from "react";

type Tab = "email" | "phone";

interface Props {
  emailForm: ReactNode;
  phoneForm: ReactNode;
}

export function LoginTabs({ emailForm, phoneForm }: Props) {
  const [tab, setTab] = useState<Tab>("email");

  return (
    <div>
      {/* Tab 头部 */}
      <div className="flex border-b border-[var(--border)] mb-4">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "email"
              ? "text-[var(--foreground)] border-[var(--primary)]"
              : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]"
          }`}
        >
          邮箱登录
        </button>
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "phone"
              ? "text-[var(--foreground)] border-[var(--primary)]"
              : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]"
          }`}
        >
          手机登录
        </button>
      </div>

      {/* Tab 内容 */}
      <div>{tab === "email" ? emailForm : phoneForm}</div>
    </div>
  );
}
