/**
 * Tag publikasi per situs. Nanti: Prisma (PostTag, slug unik per situs), id dibuat server.
 * Ubah nama/hapus tag dan merapikan tag yang tidak dipakai menyusul (perlu aturan untuk tag yang masih dipakai).
 */
import { slugify, uid } from "../format";
import { POST_TYPES, TAG_LABEL_MAX } from "../posts";
import type { PostTag, PostType, SiteSlug } from "../types";
import { clone, delay, SAVE_DELAY_MS, siteContent } from "./mock-db";

export async function createPostTag(site: SiteSlug, input: { label: string; type: PostType }): Promise<PostTag> {
  await delay(SAVE_DELAY_MS);
  const label = input.label.trim();
  const slug = slugify(label);
  if (!POST_TYPES.includes(input.type)) throw new Error("TAG_INVALID");
  if (!label || label.length > TAG_LABEL_MAX || !slug) throw new Error("TAG_INVALID");

  const c = siteContent(site);
  const sameLabel = c.postTags.some((t) => t.type === input.type && t.label.toLowerCase() === label.toLowerCase());
  if (sameLabel || c.postTags.some((t) => t.slug === slug)) throw new Error("TAG_EXISTS");

  const tag: PostTag = { id: uid("tag"), slug, label, type: input.type };
  c.postTags = [...c.postTags, tag];
  return clone(tag);
}
