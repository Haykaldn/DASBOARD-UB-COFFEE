import type { SessionUser, SiteConfig, SiteSlug } from "./types";

export const SITES: Record<SiteSlug, SiteConfig> = {
  "ub-coffee": {
    slug: "ub-coffee",
    name: "UB Coffee",
    url: "https://ub-coffee.vercel.app",
    heroMode: "SLIDESHOW",
    // Website: hero → tab Jelajahi (Menu · Reservasi · Lokasi · Event & Promo) → Tentang → Jam Buka & Kontak.
    sections: ["hero", "menu", "reservasi", "lokasi", "event", "tentang"],
    hasGallery: false,
    menuStyle: "CAROUSEL",
    hasPostDetail: true,
    hasMenuPdf: true,
    hasTasteTags: false,
    aboutTarget: "Tagline di section Tentang, di bawah logo",
    instagramTarget: "Kontak di footer dan tab Event & Promo",
  },
  "brewi-jaya": {
    slug: "brewi-jaya",
    name: "BREWi JAYA",
    url: "https://brewi-jaya.vercel.app",
    heroMode: "SINGLE",
    // Hanya Publikasi (Berita & Artikel + tag, sama dengan UB Coffee); editor landing page tidak dipakai untuk BREWi JAYA.
    sections: ["event"],
    hasGallery: true,
    menuStyle: "LIST",
    hasPostDetail: true,
    hasMenuPdf: false,
    hasTasteTags: true,
    aboutTarget: "Section “Tempat Buat Lama-Lama”",
    instagramTarget: "Ikon Instagram di footer",
  },
};

export function isSiteSlug(v: string): v is SiteSlug {
  return v === "ub-coffee" || v === "brewi-jaya";
}

export function roleLabel(user: SessionUser): string {
  if (user.role === "SUPER_ADMIN") return "Super Admin";
  return `Admin ${user.sites.map((s) => SITES[s].name).join(" & ")}`;
}

export function canAccessSite(user: SessionUser, site: SiteSlug) {
  return user.role === "SUPER_ADMIN" || user.sites.includes(site);
}

/** Meeting room milik UB Coffee: siapa pun yang memegang UB Coffee boleh mengelolanya. */
export function canAccessMeetingRoom(user: SessionUser) {
  return canAccessSite(user, "ub-coffee");
}

export type NavItem = {
  href: string;
  label: string;
  icon: "calendar" | "coffee" | "leaf";
  badge?: "pending";
  /** false = tetap tampil di sidebar tetapi terkunci (tidak bisa diklik). */
  enabled: boolean;
};

/** Ketiga menu selalu tampil; yang di luar hak akses dikunci. Akses tetap dicek di server (page). */
export function navFor(user: SessionUser): NavItem[] {
  return [
    {
      href: "/meeting-room",
      label: "Meeting Room",
      icon: "calendar",
      badge: "pending",
      enabled: canAccessMeetingRoom(user),
    },
    { href: "/publikasi/ub-coffee", label: "Konten Website UB Coffee", icon: "coffee", enabled: canAccessSite(user, "ub-coffee") },
    {
      href: "/publikasi/brewi-jaya",
      label: "Publikasi BREWi JAYA",
      icon: "leaf",
      enabled: canAccessSite(user, "brewi-jaya"),
    },
  ];
}

export function homeFor(user: SessionUser): string {
  return navFor(user).find((i) => i.enabled)?.href ?? "/login";
}
