/** Galeri. Nanti: Prisma (GalleryItem + Media), urutan lewat `sortOrder`. */
import { uid } from "../format";
import type { GalleryItem, Photo, SiteSlug } from "../types";
import { clone, delay, reorderByIds, replaceById, SAVE_DELAY_MS, siteContent } from "./mock-db";

/** Foto baru masuk di akhir galeri, tanpa keterangan. */
export async function addGalleryPhotos(site: SiteSlug, photos: Photo[]): Promise<GalleryItem[]> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.gallery = [...c.gallery, ...photos.map((photo) => ({ id: uid("g"), photo, caption: "" }))];
  return clone(c.gallery);
}

export async function updateGalleryItem(site: SiteSlug, item: GalleryItem): Promise<GalleryItem> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.gallery = replaceById(c.gallery, item);
  return clone(item);
}

export async function removeGalleryItem(site: SiteSlug, id: string): Promise<void> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.gallery = c.gallery.filter((x) => x.id !== id);
}

export async function reorderGallery(site: SiteSlug, ids: string[]): Promise<GalleryItem[]> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.gallery = reorderByIds(c.gallery, ids);
  return clone(c.gallery);
}
