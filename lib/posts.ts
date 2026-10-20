import { todayISO } from "./format";
import type { Post, PostType, Tone } from "./types";

export const POST_TYPE_LABEL: Record<PostType, string> = {
  BERITA: "Berita",
  ARTIKEL: "Artikel",
  EVENT: "Event",
  PROMO: "Promo",
  MENU_BARU: "Menu Baru",
  INFO: "Info",
};

/** Status tayang post pada tanggal `today`: Draft, Arsip, Terjadwal, Berakhir, atau Tayang. */
export function postState(p: Post, today = todayISO()): { label: string; tone: Tone; live: boolean } {
  if (p.status === "DRAFT") return { label: "Draft", tone: "mute", live: false };
  if (p.status === "ARCHIVED") return { label: "Arsip", tone: "mute", live: false };
  if (p.publishedAt > today || (p.startsAt && p.startsAt > today)) return { label: "Terjadwal", tone: "warn", live: false };
  if (p.endsAt && p.endsAt < today) return { label: "Berakhir", tone: "mute", live: false };
  return { label: "Tayang", tone: "ok", live: true };
}
