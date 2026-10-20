"use client";

import { Fragment, useState, type ReactNode } from "react";
import { postState } from "@/lib/posts";
import { SITES } from "@/lib/sites";
import type { MenuItem, SectionKey, SiteContent, SiteSlug } from "@/lib/types";
import Icon, { type IconName } from "../Icon";
import { useStore } from "../store";
import { cx, SkeletonPage, StatCard, StatGrid } from "../ui";
import AboutSection from "./AboutSection";
import GallerySection from "./GallerySection";
import HeroSection from "./HeroSection";
import MenuSection from "./MenuSection";
import OutletsSection from "./OutletsSection";
import PostsSection from "./PostsSection";
import ReservasiSection from "./ReservasiSection";

type LandingKey = Exclude<SectionKey, "event">;

/** Kartu bagian landing page: judul, ikon, penjelasan, dan ringkasan isi saat ini. */
const LANDING: Record<LandingKey, { label: string; icon: IconName; desc: string; summary: (c: SiteContent) => string }> = {
  hero: {
    label: "Foto Hero",
    icon: "images",
    desc: "Foto besar di bagian paling atas website.",
    summary: (c) => `${c.hero.length} foto`,
  },
  menu: {
    label: "Menu",
    icon: "coffee",
    desc: "Daftar minuman & makanan beserta fotonya.",
    summary: (c) => `${c.menu.filter((m) => m.isAvailable).length}/${c.menu.length} menu tersedia`,
  },
  reservasi: {
    label: "Reservasi",
    icon: "calendar",
    desc: "Info meeting room: harga sewa, fasilitas, paket, dan foto ruangan.",
    summary: (c) => (c.meetingRoom ? `${c.meetingRoom.photos.length} foto ruangan` : "Belum diatur"),
  },
  lokasi: {
    label: "Lokasi & Jam Buka",
    icon: "store",
    desc: "Alamat outlet, tautan Maps, WhatsApp, dan jam operasional.",
    summary: (c) => `${c.outlets.length} outlet`,
  },
  galeri: {
    label: "Galeri",
    icon: "image",
    desc: "Kumpulan foto suasana dan produk.",
    summary: (c) => `${c.gallery.length} foto`,
  },
  tentang: {
    label: "Tentang & Kontak",
    icon: "info",
    desc: "Tagline singkat dan akun Instagram.",
    summary: (c) => (c.settings.instagram ? `@${c.settings.instagram.replace(/^@/, "")}` : "Instagram belum diisi"),
  },
};

/** Tampilan aktif: daftar publikasi, ringkasan landing page, atau editor satu bagian landing. */
type View = "event" | "landing" | LandingKey;

const GROUPS: { key: "event" | "landing"; label: string }[] = [
  { key: "event", label: "Publikasi" },
  { key: "landing", label: "Landing Page" },
];

/**
 * Satu halaman untuk kedua situs (§3.6), dibagi dua navigasi utama:
 * - Publikasi: Artikel & Berita.
 * - Landing Page: kartu tiap bagian halaman landing, urut sesuai website (`SiteConfig.sections`);
 *   klik kartu untuk membuka editornya. Bagian yang tidak dimiliki situs tidak ditampilkan.
 * Situs tanpa bagian landing (BREWi JAYA) hanya menampilkan Publikasi, tanpa navigasi tab.
 */
export default function PublikasiView({ slug }: { slug: SiteSlug }) {
  const { ready, content, confirmLeave } = useStore();
  const site = SITES[slug];
  const c = content[slug];
  const [editingMenu, setEditingMenu] = useState<MenuItem | "new" | null>(null);
  const landingSections = site.sections.filter((k): k is LandingKey => k !== "event");
  const hasLanding = landingSections.length > 0;
  // Tampilan aktif disimpan di hash URL (#landing, #menu) agar bisa dibagikan / tetap saat dimuat ulang.
  const [view, setView] = useState<View>(() => {
    const h = typeof window === "undefined" ? "" : window.location.hash.slice(1);
    if (h === "landing" && hasLanding) return "landing";
    return landingSections.find((k) => k === h) ?? "event";
  });

  if (!ready) return <SkeletonPage />;

  const available = c.menu.filter((m) => m.isAvailable).length;
  const states = c.posts.map((p) => postState(p));
  const live = states.filter((s) => s.live).length;
  const group = view === "event" ? "event" : "landing";

  /** Pindah tampilan; form yang belum disimpan di tampilan lama memicu konfirmasi. */
  const go = (k: View) => {
    if (k === view || !confirmLeave()) return;
    setView(k);
    history.replaceState(null, "", `#${k}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const render: Record<LandingKey, () => ReactNode> = {
    hero: () => <HeroSection site={site} />,
    tentang: () => <AboutSection site={site} />,
    menu: () => <MenuSection site={site} editing={editingMenu} setEditing={setEditingMenu} />,
    reservasi: () => <ReservasiSection site={site} />,
    lokasi: () => <OutletsSection site={site} />,
    galeri: () => <GallerySection site={site} />,
  };

  return (
    <>
      {hasLanding ? (
        <StatGrid>
          <StatCard icon="coffee" tone="green" value={`${available}/${c.menu.length}`} label="Menu tersedia" />
          <StatCard icon="megaphone" tone="yellow" value={live} label="Artikel & berita tayang" />
          {site.hasGallery ? (
            <StatCard icon="images" tone="blue" value={c.gallery.length} label="Foto galeri" />
          ) : (
            <StatCard icon="images" tone="blue" value={c.hero.length} label="Foto hero" />
          )}
          <StatCard icon="store" tone="slate" value={c.outlets.length} label="Outlet" />
        </StatGrid>
      ) : (
        <StatGrid>
          <StatCard icon="megaphone" tone="green" value={live} label="Tayang" />
          <StatCard icon="clock" tone="yellow" value={states.filter((s) => s.label === "Terjadwal").length} label="Terjadwal" />
          <StatCard icon="edit" tone="blue" value={states.filter((s) => s.label === "Draft").length} label="Draft" />
          <StatCard icon="archive" tone="slate" value={c.posts.length} label="Total publikasi" />
        </StatGrid>
      )}

      {hasLanding && (
        <div className="mb-5 rounded-2xl border border-line bg-page p-1.5">
          <div role="tablist" aria-label="Navigasi publikasi" className="flex gap-1">
            {GROUPS.map((g) => {
              const active = g.key === group;
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  // Klik "Landing Page" dari dalam editor bagian = kembali ke daftar kartu.
                  onClick={() => go(g.key)}
                  className={cx(
                    "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold whitespace-nowrap transition-colors",
                    active ? "bg-navy text-white shadow-[0_6px_14px_-8px_rgb(15_60_107/0.7)]" : "text-ink-2 hover:bg-white hover:text-navy",
                  )}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === "event" && <PostsSection site={site} />}

      {view === "landing" && (
        <section aria-labelledby="landing-title">
          <div className="mb-4">
            <h2 id="landing-title" className="text-lg font-extrabold tracking-tight text-navy">
              Bagian Landing Page
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-3">Pilih bagian yang ingin diubah. Urutan kartu sama dengan urutan di website.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {landingSections.map((k, i) => {
              const s = LANDING[k];
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => go(k)}
                    className="group flex h-full w-full flex-col rounded-[20px] border border-line bg-white p-5 text-left shadow-[0_1px_3px_rgb(15_23_42/0.04)] transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[0_14px_28px_-18px_rgb(15_60_107/0.55)] focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-12 place-items-center rounded-2xl bg-navy/[0.07] text-navy transition-colors group-hover:bg-navy group-hover:text-white">
                        <Icon name={s.icon} size={24} />
                      </span>
                      <span className="grid size-6 place-items-center rounded-md bg-page text-[11px] font-bold text-ink-3 tabular-nums">{i + 1}</span>
                    </div>
                    <h3 className="mt-4 text-base font-extrabold text-navy">{s.label}</h3>
                    <p className="mt-1 text-[13px] text-ink-3">{s.desc}</p>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
                        <span className="text-[13px] font-bold text-ink-2">{s.summary(c)}</span>
                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-navy">
                          Kelola
                          <Icon name="chevronRight" size={16} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {view !== "event" && view !== "landing" && (
        <>
          <nav aria-label="Lokasi" className="mb-4 flex items-center gap-2 text-[13px]">
            <button
              type="button"
              onClick={() => go("landing")}
              aria-label="Kembali ke daftar bagian Landing Page"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-3 font-bold text-ink-2 hover:bg-page hover:text-navy"
            >
              <Icon name="chevronLeft" size={16} />
              Back
            </button>
            <Icon name="chevronRight" size={14} className="text-ink-3" />
            <span className="font-bold text-navy" aria-current="page">
              {LANDING[view].label}
            </span>
          </nav>
          <Fragment key={`${view}-${slug}`}>{render[view]()}</Fragment>
        </>
      )}
    </>
  );
}
