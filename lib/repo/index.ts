/**
 * Lapisan data dashboard. Komponen tidak memanggil ini langsung, tetapi lewat
 * components/data-hooks.tsx. Isinya sekarang mock (mock-db.ts), nanti Prisma/server action.
 */
import type { SiteContent, SiteSlug } from "../types";
import { clone, delay, LOAD_DELAY_MS, mockDb } from "./mock-db";

export * from "./bookings";
export * from "./gallery";
export * from "./hero";
export * from "./meeting-room-info";
export * from "./menu";
export * from "./outlets";
export * from "./post-tags";
export * from "./posts";
export * from "./settings";
export { resetMockDb } from "./mock-db";

/** Seluruh konten satu situs, untuk muat awal dashboard. */
export async function getSiteContent(site: SiteSlug): Promise<SiteContent> {
  await delay(LOAD_DELAY_MS);
  return clone(mockDb().content[site]);
}
