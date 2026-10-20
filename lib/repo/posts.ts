/** Publikasi (artikel & berita). Nanti: Prisma (Post, slug unik per situs), id dibuat server. */
import { POST_TAGS_MAX } from "../posts";
import { SITES } from "../sites";
import type { Post, SiteSlug } from "../types";
import { clone, delay, replaceById, SAVE_DELAY_MS, siteContent } from "./mock-db";

/** Pengaman slug kembar (klien juga memeriksa untuk pesan cepat). Aturannya sama: hanya situs dengan halaman detail. */
function assertSlugFree(site: SiteSlug, post: Post) {
  if (!SITES[site].hasPostDetail) return;
  if (siteContent(site).posts.some((p) => p.slug === post.slug && p.id !== post.id)) throw new Error("SLUG_TAKEN");
}

/** 1–3 tag yang ada di situs ini, tidak kembar, dan jenisnya sama dengan post. */
function assertTagsValid(site: SiteSlug, post: Post) {
  const known = siteContent(site).postTags;
  const ok =
    post.tags.length >= 1 &&
    post.tags.length <= POST_TAGS_MAX &&
    new Set(post.tags).size === post.tags.length &&
    post.tags.every((id) => known.some((t) => t.id === id && t.type === post.type));
  if (!ok) throw new Error("INVALID_TAGS");
}

function assertPostValid(site: SiteSlug, post: Post) {
  assertSlugFree(site, post);
  assertTagsValid(site, post);
}

export async function createPost(site: SiteSlug, post: Post): Promise<Post> {
  await delay(SAVE_DELAY_MS);
  assertPostValid(site, post);
  const c = siteContent(site);
  c.posts = [...c.posts, post];
  return clone(post);
}

export async function updatePost(site: SiteSlug, post: Post): Promise<Post> {
  await delay(SAVE_DELAY_MS);
  assertPostValid(site, post);
  const c = siteContent(site);
  c.posts = replaceById(c.posts, post);
  return clone(post);
}

export async function removePost(site: SiteSlug, id: string): Promise<void> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  c.posts = c.posts.filter((x) => x.id !== id);
}
