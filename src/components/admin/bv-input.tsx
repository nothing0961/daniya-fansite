"use client";

import { BilibiliEmbed } from "@/components/media/bilibili-embed";

interface BvInputProps {
  value: string;
  onChange: (bvId: string) => void;
}

const BV_REGEX = /^BV[a-zA-Z0-9]{10}$/;

export function BvInput({ value, onChange }: BvInputProps) {
  const isValid = BV_REGEX.test(value);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="BV1xx411c7X"
        className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      {value && !isValid && (
        <p className="text-xs text-[var(--muted-foreground)]">
          BV 号格式不正确（应以 BV 开头，后接 10 位字母或数字）
        </p>
      )}
      {isValid && (
        <div className="max-w-md">
          <BilibiliEmbed bvId={value} />
        </div>
      )}
    </div>
  );
}
