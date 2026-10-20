import { todayISO } from "./format";
import type { Post, PostTag, PostType, Tone } from "./types";

export const POST_TYPE_LABEL: Record<PostType, string> = {
  BERITA: "Berita",
  ARTIKEL: "Artikel",
  EVENT: "Event",
  PROMO: "Promo",
  MENU_BARU: "Menu Baru",
};

/** Batas tag per post (situs dengan `hasPostTags`). */
export const POST_TAGS_MAX = 3;
/** Panjang maksimal label tag. */
export const TAG_LABEL_MAX = 30;

/** Tag yang boleh dipakai post berjenis `type`. */
export function tagsOfType(tags: PostTag[], type: PostType): PostTag[] {
  return tags.filter((t) => t.type === type);
}

/** Label tag sesuai urutan `ids`; id yang tidak dikenal dilewati. */
export function tagLabels(tags: PostTag[], ids: string[]): string[] {
  return ids.flatMap((id) => tags.find((t) => t.id === id)?.label ?? []);
}

/** Status tayang post pada tanggal `today`: Draft, Arsip, Terjadwal, Berakhir, atau Tayang. */
export function postState(p: Post, today = todayISO()): { label: string; tone: Tone; live: boolean } {
  if (p.status === "DRAFT") return { label: "Draft", tone: "mute", live: false };
  if (p.status === "ARCHIVED") return { label: "Arsip", tone: "mute", live: false };
  if (p.publishedAt > today || (p.startsAt && p.startsAt > today)) return { label: "Terjadwal", tone: "warn", live: false };
  if (p.endsAt && p.endsAt < today) return { label: "Berakhir", tone: "mute", live: false };
  return { label: "Tayang", tone: "ok", live: true };
}
