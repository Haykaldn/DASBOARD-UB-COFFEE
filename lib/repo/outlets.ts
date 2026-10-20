/** Lokasi & jam buka. Nanti: Prisma (Outlet + OutletHours), id dibuat server. */
import type { Outlet, SiteSlug } from "../types";
import { clone, delay, replaceById, SAVE_DELAY_MS, siteContent } from "./mock-db";

export async function createOutlet(site: SiteSlug, outlet: Outlet): Promise<Outlet> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.outlets = [...c.outlets, outlet];
  return clone(outlet);
}

export async function updateOutlet(site: SiteSlug, outlet: Outlet): Promise<Outlet> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.outlets = replaceById(c.outlets, outlet);
  return clone(outlet);
}

export async function removeOutlet(site: SiteSlug, id: string): Promise<void> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.outlets = c.outlets.filter((x) => x.id !== id);
}
