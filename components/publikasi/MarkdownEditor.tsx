"use client";

import { useRef, useState, type ReactNode } from "react";
import { cx, inputCls } from "../ui";

/** Render Markdown sederhana sebagai elemen React (tanpa innerHTML → aman dari XSS). */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https:\/\/[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("*")) out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\((.+)\)$/.exec(t)!;
      out.push(
        <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="text-sidebar-active underline">
          {label}
        </a>,
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function render(md: string): ReactNode {
  const blocks = md.trim().split(/\n{2,}/);
  return blocks.map((b, i) => {
    const lines = b.split("\n");
    if (lines.every((l) => /^[-*] /.test(l)))
      return (
        <ul key={i} className="mb-3 list-disc pl-5">
          {lines.map((l, j) => (
            <li key={j}>{inline(l.slice(2))}</li>
          ))}
        </ul>
      );
    if (b.startsWith("## ")) return <h3 key={i} className="mb-2 font-bold">{inline(b.slice(3))}</h3>;
    return (
      <p key={i} className="mb-3">
        {lines.flatMap((l, j) => (j ? [<br key={`br${j}`} />, ...inline(l)] : inline(l)))}
      </p>
    );
  });
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  describedBy?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function wrap(before: string, after = before, placeholder = "teks") {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }

  const tool = "min-h-9 rounded-lg px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-white hover:text-ink";

  return (
    <div className="overflow-hidden rounded-xl border border-line focus-within:border-sidebar-active">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-page px-2 py-1.5" role="toolbar" aria-label="Format teks">
        <button type="button" className={tool} onClick={() => wrap("**")} disabled={preview}>
          <strong>B</strong> Tebal
        </button>
        <button type="button" className={tool} onClick={() => wrap("*")} disabled={preview}>
          <em>I</em> Miring
        </button>
        <button type="button" className={tool} onClick={() => wrap("\n- ", "", "poin")} disabled={preview}>
          Daftar
        </button>
        <button type="button" className={tool} onClick={() => wrap("[", "](https://)", "teks tautan")} disabled={preview}>
          Tautan
        </button>
        <button
          type="button"
          aria-pressed={preview}
          onClick={() => setPreview((p) => !p)}
          className={cx(tool, "ml-auto", preview && "bg-white text-ink")}
        >
          {preview ? "Edit" : "Pratinjau"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-[160px] px-3.5 py-3 text-[15px] break-words text-ink">
          {value.trim() ? render(value) : <p className="text-ink-3">Belum ada isi.</p>}
        </div>
      ) : (
        <textarea
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          rows={7}
          maxLength={5000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(inputCls, "rounded-none border-0 py-2.5 focus:ring-0")}
        />
      )}
    </div>
  );
}
