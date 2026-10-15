"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";
import { navFor, roleLabel } from "@/lib/sites";
import Icon from "./Icon";
import { useStore } from "./store";
import { cx } from "./ui";

/** Logo teks dua warna (navy + hijau), dipakai juga di halaman login. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <p className={cx("text-[22px] leading-none font-extrabold tracking-tight", className)}>
      <span className="text-navy">Panel</span>
      <span className="text-brand">Konten</span>
    </p>
  );
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { user, bookings, confirmLeave } = useStore();
  const pathname = usePathname();
  const pending = bookings.filter((b) => b.status === "PENDING" && !b.isInternal).length;
  const items = navFor(user);

  return (
    <>
      {mobileOpen && (
        <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-ink/40 md:hidden" />
      )}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-line bg-sidebar transition-transform duration-200",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          collapsed ? "md:-translate-x-full" : "md:translate-x-0 md:shadow-none",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-6">
          <div className="min-w-0">
            <BrandMark />
            <p className="mt-1.5 text-[11px] font-semibold text-ink-3">UB Coffee · BREWi JAYA</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-page md:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-3 pt-6 pb-4">
          <p className="mb-2.5 px-3 text-[11px] font-bold tracking-[0.12em] text-ink-3 uppercase">Kelola Konten</p>
          <ul className="grid gap-1">
            {items.map((it) => {
              const active = pathname === it.href || pathname.startsWith(it.href + "/");
              if (!it.enabled) {
                // Tetap terlihat tetapi terkunci: bukan link, tidak bisa diklik atau difokus.
                return (
                  <li key={it.href}>
                    <span
                      aria-disabled="true"
                      title="Akun Anda tidak memiliki akses ke menu ini"
                      className="flex min-h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-3/70 select-none"
                    >
                      <Icon name={it.icon} size={18} className="shrink-0" />
                      <span className="min-w-0 flex-1">{it.label}</span>
                      <Icon name="lock" size={15} className="shrink-0" />
                      <span className="sr-only">(tidak ada akses)</span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      if (!active && !confirmLeave()) e.preventDefault();
                    }}
                    className={cx(
                      "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                      active ? "bg-navy text-white shadow-[0_6px_14px_-6px_rgb(15_60_107/0.6)]" : "text-ink hover:bg-page",
                    )}
                  >
                    <Icon name={it.icon} size={18} className={cx("shrink-0", !active && "text-brand")} />
                    <span className="min-w-0 flex-1">{it.label}</span>
                    {it.badge === "pending" && pending > 0 && (
                      <span
                        className={cx(
                          "grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-bold",
                          active ? "bg-white text-navy" : "bg-amber-100 text-amber-800",
                        )}
                        aria-label={`${pending} booking menunggu`}
                      >
                        {pending}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-page px-3.5 py-3">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-extrabold text-navy">{user.name}</p>
              <p className="truncate text-xs font-semibold text-brand-fg">{roleLabel(user)}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Keluar"
                title="Keluar"
                className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-white hover:text-ink"
              >
                <Icon name="logout" size={19} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
