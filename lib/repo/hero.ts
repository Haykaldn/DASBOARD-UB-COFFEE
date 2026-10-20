/** Foto hero. Nanti: Prisma (HeroSlide + Media), urutan lewat `sortOrder`. */
import { SITES } from "../sites";
import type { Photo, SiteSlug } from "../types";
import { clone, delay, reorderByIds, SAVE_DELAY_MS, siteContent } from "./mock-db";

/** Slideshow: foto ditambahkan di akhir. Satu foto (SINGLE): foto lama diganti. */
export async function addHeroPhotos(site: SiteSlug, photos: Photo[]): Promise<Photo[]> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.hero = SITES[site].heroMode === "SLIDESHOW" ? [...c.hero, ...photos] : [photos[0]];
  return clone(c.hero);
}

export async function reorderHero(site: SiteSlug, ids: string[]): Promise<Photo[]> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.hero = reorderByIds(c.hero, ids);
  return clone(c.hero);
}

export async function removeHeroPhoto(site: SiteSlug, id: string): Promise<Photo[]> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.hero = c.hero.filter((x) => x.id !== id);
  return clone(c.hero);
}
