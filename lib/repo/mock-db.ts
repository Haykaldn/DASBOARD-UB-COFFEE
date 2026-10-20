/**
 * "Database" tiruan di memori selama CMS belum punya database. Hanya file ini yang membaca
 * lib/mock-data.ts. Diganti Prisma (spesifikasi bagian 7): saat itu file ini dihapus.
 *
 * Seluruh lib/repo bebas API browser (navigator, window, localStorage, ...) karena nanti
 * berjalan di server, dan argumen/nilai kembaliannya data biasa yang serializable.
 */
import { mockBookings, mockContent } from "../mock-data";
import type { Booking, SiteContent, SiteSlug } from "../types";

type MockDb = { bookings: Booking[]; content: Record<SiteSlug, SiteContent> };

let db: MockDb | null = null;

/** Isi ulang data contoh. Dipanggil saat dashboard dipasang, jadi refresh/login ulang = data awal. */
export function resetMockDb(today: string) {
  db = { bookings: mockBookings(today), content: mockContent(today) };
}

export function mockDb(): MockDb {
  if (!db) throw new Error("mock-db belum diisi: panggil resetMockDb() dulu.");
  return db;
}

// Jeda simulasi jaringan. Dihapus saat diganti Prisma.
export const LOAD_DELAY_MS = 350;
export const SAVE_DELAY_MS = 450;

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Salinan data, seperti hasil yang melewati jaringan: tidak berbagi referensi dengan pemanggil. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Konten satu situs di mock-db (bisa diubah langsung oleh fungsi repo). */
export function siteContent(site: SiteSlug): SiteContent {
  return mockDb().content[site];
}

/** Susun ulang item sesuai daftar id. Daftar harus berisi tepat semua id yang ada. Nanti: update `sortOrder`. */
export function reorderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  if (ids.length !== items.length || new Set(ids).size !== ids.length) throw new Error("REORDER_MISMATCH");
  return ids.map((id) => {
    const item = items.find((x) => x.id === id);
    if (!item) throw new Error("REORDER_MISMATCH");
    return item;
  });
}

/** Ganti item dengan id yang sama; error jika tidak ada. */
export function replaceById<T extends { id: string }>(items: T[], item: T): T[] {
  if (!items.some((x) => x.id === item.id)) throw new Error("NOT_FOUND");
  return items.map((x) => (x.id === item.id ? item : x));
}
