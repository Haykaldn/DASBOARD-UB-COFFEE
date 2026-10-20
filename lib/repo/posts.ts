/** Publikasi (artikel & berita). Nanti: Prisma (Post, slug unik per situs), id dibuat server. */
import { SITES } from "../sites";
import type { Post, SiteSlug } from "../types";
import { clone, delay, replaceById, SAVE_DELAY_MS, siteContent } from "./mock-db";

/** Pengaman slug kembar (klien juga memeriksa untuk pesan cepat). Aturannya sama: hanya situs dengan halaman detail. */
function assertSlugFree(site: SiteSlug, post: Post) {
  if (!SITES[site].hasPostDetail) return;
  if (siteContent(site).posts.some((p) => p.slug === post.slug && p.id !== post.id)) throw new Error("SLUG_TAKEN");
}

export async function createPost(site: SiteSlug, post: Post): Promise<Post> {
  await delay(SAVE_DELAY_MS);
  assertSlugFree(site, post);
  const c = siteContent(site);
  c.posts = [...c.posts, post];
  return clone(post);
}

export async function updatePost(site: SiteSlug, post: Post): Promise<Post> {
  await delay(SAVE_DELAY_MS);
  assertSlugFree(site, post);
  const c = siteContent(site);
  c.posts = replaceById(c.posts, post);
  return clone(post);
}

export async function removePost(site: SiteSlug, id: string): Promise<void> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.posts = c.posts.filter((x) => x.id !== id);
}
