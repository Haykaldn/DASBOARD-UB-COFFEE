/** Tentang & kontak, link menu PDF. Nanti: Prisma (SiteSetting, key-value tervalidasi). */
import type { SiteSettings, SiteSlug } from "../types";
import { clone, delay, SAVE_DELAY_MS, siteContent } from "./mock-db";

export async function updateSettings(site: SiteSlug, patch: Partial<SiteSettings>): Promise<SiteSettings> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.settings = { ...c.settings, ...patch };
  return clone(c.settings);
}
