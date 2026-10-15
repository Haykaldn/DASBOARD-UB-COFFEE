"use client";

import { usePathname } from "next/navigation";
import { SITES } from "@/lib/sites";
import Icon from "./Icon";

function pageInfo(pathname: string) {
  if (pathname.startsWith("/meeting-room"))
    return { title: "Meeting Room", subtitle: "Booking ruang meeting UB Coffee", site: SITES["ub-coffee"] };
  const site = pathname.startsWith("/publikasi/brewi-jaya") ? SITES["brewi-jaya"] : SITES["ub-coffee"];
  return { title: `Publikasi ${site.name}`, subtitle: `Kelola konten website ${site.name}`, site };
}

/** Banner navy di atas konten: tombol panel, judul halaman, dan tautan ke website. */
export default function TopBar({ onToggleNav }: { onToggleNav: () => void }) {
  const pathname = usePathname();
  const { title, subtitle, site } = pageInfo(pathname);

  return (
    <header className="flex min-h-[68px] items-center gap-3 rounded-2xl bg-navy px-3 py-3 text-white shadow-[0_10px_28px_-12px_rgb(15_60_107/0.55)] md:px-5">
      <button
        type="button"
        onClick={onToggleNav}
        aria-label="Tampilkan atau sembunyikan menu"
        title="Menu"
        className="grid size-10 shrink-0 place-items-center rounded-xl text-white/85 hover:bg-white/10 hover:text-white"
      >
        <Icon name="panel" size={20} />
      </button>
      <div className="min-w-0 flex-1 border-l border-white/15 pl-4">
        <p className="truncate text-[17px] leading-tight font-extrabold tracking-tight md:text-lg">{title}</p>
        <p className="truncate text-xs font-semibold text-white/75">{subtitle}</p>
      </div>
      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-[13px] font-bold text-white hover:bg-white/10"
      >
        <span className="hidden sm:inline">Lihat situs</span>
        <span className="sm:hidden">Situs</span>
        <Icon name="external" size={16} />
        <span className="sr-only">{site.name} (membuka tab baru)</span>
      </a>
    </header>
  );
}
