"use client";

import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { Tone } from "@/lib/types";
import Icon, { type IconName } from "./Icon";

export type { Tone };

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export { cx };

/* ---------- Button ---------- */

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-navy text-white hover:bg-navy-hover border border-navy hover:border-navy-hover shadow-[0_6px_14px_-8px_rgb(15_60_107/0.7)]",
  secondary: "bg-white text-navy border border-line hover:bg-page shadow-sm",
  danger: "bg-white text-danger border border-red-200 hover:bg-danger-bg",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:bg-page",
};

export function Button({
  variant = "secondary",
  icon,
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName; size?: "md" | "sm" }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        size === "md" ? "min-h-11 px-4 text-sm" : "min-h-10 px-3 text-[13px]",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-2 hover:bg-page hover:text-ink disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

/* ---------- Form ---------- */

export const inputCls =
  "w-full min-h-11 rounded-xl border border-line bg-page px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/15 aria-[invalid=true]:border-danger";

export function Field({
  label,
  hint,
  showOn,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: ReactNode;
  showOn?: string;
  error?: string | null;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint || showOn ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-navy">
        {label}
        {optional && <span className="font-normal text-ink-3"> (opsional)</span>}
      </label>
      {children(id, describedBy)}
      {(hint || showOn) && (
        <div id={hintId} className="mt-1.5 space-y-0.5 text-[13px] text-ink-3">
          {hint && <p>{hint}</p>}
          {showOn && <FieldHint>{showOn}</FieldHint>}
        </div>
      )}
      {error && (
        <p id={errId} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[13px] text-ink-3">
      <Icon name="info" size={15} className="mt-0.5 shrink-0" />
      <span>
        Tampil di: <span className="text-ink-2">{children}</span>
      </span>
    </p>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium select-none">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 shrink-0 cursor-pointer accent-navy"
      />
      {label}
    </label>
  );
}

/* ---------- Status ---------- */

const TONE: Record<Tone, string> = {
  warn: "border-amber-300 bg-amber-50 text-amber-700",
  ok: "border-emerald-300 bg-emerald-50 text-emerald-700",
  mute: "border-slate-200 bg-slate-50 text-slate-600",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  danger: "border-red-200 bg-red-50 text-red-700",
};

/** Chip status: huruf kapital kecil dengan garis tepi berwarna. */
export function StatusChip({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-lg border px-2 py-1 text-[10.5px] leading-none font-extrabold tracking-[0.06em] whitespace-nowrap uppercase",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Filter berbentuk segmented control (latar abu, pilihan aktif putih). */
export function PillFilter<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-bold transition-colors",
              active ? "bg-white text-navy shadow-sm" : "text-ink-3 hover:text-navy",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cx(
                  "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                  active ? "bg-navy/10 text-navy" : "bg-white/70 text-ink-3",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Layout blocks ---------- */

const STAT_TONE = {
  blue: { card: "border-blue-200", icon: "bg-blue-50 text-blue-600" },
  yellow: { card: "border-amber-300", icon: "bg-amber-50 text-amber-500" },
  green: { card: "border-emerald-200", icon: "bg-emerald-50 text-emerald-600" },
  slate: { card: "border-indigo-200", icon: "bg-indigo-50 text-indigo-500" },
} as const;

/** Kartu angka: garis tepi berwarna, ikon di kotak lembut, label huruf kapital kecil. */
export function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: IconName;
  value: ReactNode;
  label: string;
  tone: keyof typeof STAT_TONE;
}) {
  return (
    <div className={cx("flex min-w-0 items-center gap-4 rounded-2xl border-[1.5px] bg-white p-4 md:px-5 md:py-6", STAT_TONE[tone].card)}>
      <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl", STAT_TONE[tone].icon)}>
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] leading-snug font-extrabold tracking-[0.12em] text-ink-3 uppercase">{label}</p>
        <p className="mt-0.5 text-[26px] leading-tight font-extrabold text-navy tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">{children}</div>;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="scroll-mt-6 rounded-[20px] border border-line bg-white p-4 shadow-[0_1px_3px_rgb(15_23_42/0.04)] md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-[240px]">
          <h2 id={id ? `${id}-title` : undefined} className="text-lg font-extrabold tracking-tight text-navy">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function LockedNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-page px-4 py-3 text-sm text-ink-2">
      <Icon name="lock" size={18} className="mt-0.5 shrink-0 text-ink-3" />
      <p>{children}</p>
    </div>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-line bg-page/70 px-4 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full border border-line bg-white text-ink-3 shadow-sm">
        <Icon name="box" size={26} />
      </span>
      <p className="max-w-[40ch] text-sm font-bold text-navy">{text}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("animate-pulse rounded-xl bg-mute-bg", className)} />;
}

export function SkeletonPage() {
  return (
    <div aria-busy="true" aria-label="Memuat data">
      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[86px]" />
        ))}
      </div>
      <Skeleton className="mb-4 h-24" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
