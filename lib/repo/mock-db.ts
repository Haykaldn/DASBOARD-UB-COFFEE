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
