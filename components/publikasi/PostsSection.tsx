"use client";

import { useState } from "react";
import { formatDateMedium } from "@/lib/format";
import { POST_TYPE_LABEL, postState, tagLabels } from "@/lib/posts";
import type { Post, PostTag, SiteConfig } from "@/lib/types";
import { usePosts } from "../data-hooks";
import PhotoView from "../PhotoView";
import { Button, EmptyState, SectionCard, StatusChip } from "../ui";
import { PostEditor } from "./posts/PostEditor";

/** Label kartu: tipe, ditambah tag bila ada (mis. "Berita · Event, Promo"). */
function postLabel(tags: PostTag[], p: Post) {
  const labels = tagLabels(tags, p.tags);
  return labels.length ? `${POST_TYPE_LABEL[p.type]} · ${labels.join(", ")}` : POST_TYPE_LABEL[p.type];
}

export default function PostsSection({ site }: { site: SiteConfig }) {
  const data = usePosts(site.slug);
  const posts = [...data.posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  // Form tambah/edit tampil sebagai halaman penuh di dalam tab, menggantikan daftar.
  if (editing) {
    return (
      <PostEditor
        key={editing === "new" ? "new" : editing.id}
        site={site}
        post={editing === "new" ? null : editing}
        allTags={data.tags}
        createTag={data.createTag}
        slugTaken={data.slugTaken}
        onClose={() => setEditing(null)}
        onSave={data.save}
        onDelete={data.remove}
      />
    );
  }

  return (
    <SectionCard
      id="event"
      title="Artikel & Berita"
      description={
        site.hasPostDetail
          ? "Berita dan artikel. Post terjadwal tayang otomatis pada tanggal terbit."
          : "Kartu “Kabar terbaru” di tab Event & Promo website, urut dari tanggal terbaru. Post terjadwal tayang otomatis pada tanggal terbit."
      }
      action={
        <Button icon="plus" onClick={() => setEditing("new")}>
          Tambah Publikasi
        </Button>
      }
    >
      {posts.length === 0 ? (
        <EmptyState
          text="Belum ada publikasi. Tambah artikel pertama."
          action={
            <Button icon="plus" onClick={() => setEditing("new")}>
              Tambah Publikasi
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {posts.map((p) => {
            const st = postState(p);
            return (
              <li key={p.id} className="flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-white">
                <div className="relative aspect-video bg-page">
                  <PhotoView photo={p.cover} label={`Belum ada poster ${p.title}`} />
                  <div className="absolute inset-x-2 top-2 flex flex-wrap justify-between gap-1.5">
                    <StatusChip tone="info" className="bg-white/95 text-ink">
                      {postLabel(data.tags, p)}
                    </StatusChip>
                    <StatusChip tone={st.tone}>{st.label}</StatusChip>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-bold break-words">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink-2">
                    {p.startsAt && p.endsAt
                      ? `${formatDateMedium(p.startsAt)} – ${formatDateMedium(p.endsAt)}`
                      : `Terbit ${formatDateMedium(p.publishedAt)}`}
                  </p>
                  <div className="mt-auto flex justify-end pt-3">
                    <Button size="sm" icon="edit" onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`}>
                      Edit
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
