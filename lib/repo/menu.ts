/** Menu. Nanti: Prisma (MenuItem), urutan lewat `sortOrder`, id dibuat server. */
import type { MenuItem, SiteSlug } from "../types";
import { clone, delay, reorderByIds, replaceById, SAVE_DELAY_MS, siteContent } from "./mock-db";

export async function createMenuItem(site: SiteSlug, item: MenuItem): Promise<MenuItem> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.menu = [...c.menu, item];
  return clone(item);
}

export async function updateMenuItem(site: SiteSlug, item: MenuItem): Promise<MenuItem> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.menu = replaceById(c.menu, item);
  return clone(item);
}

export async function setMenuAvailable(site: SiteSlug, id: string, available: boolean): Promise<MenuItem> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  const item = c.menu.find((x) => x.id === id);
  if (!item) throw new Error("NOT_FOUND");
  const next = { ...item, isAvailable: available };
  c.menu = replaceById(c.menu, next);
  return clone(next);
}

export async function removeMenuItem(site: SiteSlug, id: string): Promise<void> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.menu = c.menu.filter((x) => x.id !== id);
}

export async function reorderMenu(site: SiteSlug, ids: string[]): Promise<MenuItem[]> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.menu = reorderByIds(c.menu, ids);
  return clone(c.menu);
}
