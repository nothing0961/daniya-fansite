"use client";

import { useState } from "react";
import { Eye, Edit3 } from "lucide-react";

interface MdxEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function renderMarkdown(raw: string): string {
  let html = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-[var(--primary)] pl-4 italic text-[var(--muted-foreground)]">$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-3">');
  html = html.replace(/^(?!<)(.+)$/gm, '<p class="mb-3">$1</p>');
  return html;
}

export function MdxEditor({ value, onChange }: MdxEditorProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 border border-[var(--border)] rounded-md overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            !preview
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Edit3 className="h-3 w-3" />
          编辑
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            preview
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Eye className="h-3 w-3" />
          预览
        </button>
      </div>

      {preview ? (
        <div
          className="min-h-[400px] rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--foreground)] leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(value || "（暂无内容）"),
          }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="在此编写 MDX 正文内容..."
          className="flex min-h-[400px] w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] resize-y"
        />
      )}
    </div>
  );
}
