"use client";

import { useState } from "react";
import type { Photo, SiteConfig } from "@/lib/types";
import { ConfirmDialog } from "../Dialog";
import Icon from "../Icon";
import { UPLOAD_RULE, useImageUpload } from "../ImageUploader";
import PhotoView from "../PhotoView";
import { useHero } from "../data-hooks";
import SortableGrid from "../SortableGrid";
import { Button, EmptyState, LockedNotice, SectionCard } from "../ui";

export default function HeroSection({ site }: { site: SiteConfig }) {
  const hero = useHero(site.slug);
  const photos = hero.photos;
  const [toDelete, setToDelete] = useState<{ photo: Photo; index: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const slideshow = site.heroMode === "SLIDESHOW";

  const upload = useImageUpload(
    (added) => {
      void hero.add(added);
    },
    { multiple: slideshow },
  );

  return (
    <SectionCard
      id="hero"
      title="Foto Hero"
      description={slideshow ? `${photos.length} foto, tampil bergantian sebagai slideshow di bagian paling atas website.` : "Satu foto latar di bagian paling atas website."}
      action={
        slideshow && (
          <Button icon="plus" onClick={upload.trigger} disabled={upload.busy}>
            Tambah Foto
          </Button>
        )
      }
    >
      <LockedNotice>
        <strong className="text-ink">Judul hero: {site.name}</strong> — terkunci, tidak dapat diubah dari dashboard.
        {site.slug === "ub-coffee" && " Jam buka di hero diambil dari outlet pertama di section Lokasi & Jam Buka."}
      </LockedNotice>

      {slideshow ? (
        <>
          {photos.length === 0 ? (
            <EmptyState
              text="Belum ada foto hero. Tambah foto pertama."
              action={
                <Button icon="plus" onClick={upload.trigger}>
                  Tambah Foto
                </Button>
              }
            />
          ) : (
            <SortableGrid
              items={photos}
              getId={(p) => p.id}
              getLabel={(p, i) => `foto ${i + 1} (${p.alt})`}
              onReorder={hero.reorder}
              className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
              renderItem={(p, i, handle) => (
                <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-page">
                  <PhotoView photo={p} />
                  <span className="absolute top-2 left-2 grid h-7 min-w-7 place-items-center rounded-lg bg-ink/80 px-1.5 text-xs font-bold text-white tabular-nums">
                    {i + 1}
                  </span>
                  <div className="absolute right-2 bottom-2 left-2 flex justify-between gap-2">
                    {handle}
                    <button
                      type="button"
                      aria-label={`Hapus foto ${i + 1} (${p.alt})`}
                      title="Hapus foto"
                      onClick={() => setToDelete({ photo: p, index: i })}
                      className="grid size-10 place-items-center rounded-lg bg-white/90 text-danger shadow-sm hover:bg-white"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </div>
              )}
              after={
                <li>
                  <button
                    type="button"
                    onClick={upload.trigger}
                    disabled={upload.busy}
                    className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-ink-2 hover:border-sidebar-active hover:text-sidebar-active disabled:opacity-55"
                  >
                    <Icon name="plus" size={22} />
                    Tambah
                  </button>
                </li>
              }
            />
          )}
          {upload.status}
          <p className="mt-3 text-[13px] text-ink-3">
            Seret pegangan <Icon name="grip" size={14} className="inline align-[-2px]" /> untuk mengubah urutan. Disarankan foto
            landscape, lebar minimal 1920 px. {UPLOAD_RULE}
          </p>
        </>
      ) : (
        <div className="max-w-[640px]">
          <div className="aspect-video overflow-hidden rounded-xl border border-line bg-page">
            <PhotoView photo={photos[0] ?? null} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button icon="upload" onClick={upload.trigger} disabled={upload.busy}>
              Ganti foto
            </Button>
            <p className="text-[13px] text-ink-3">Disarankan landscape 16:9, lebar minimal 1920 px. {UPLOAD_RULE}</p>
          </div>
          {upload.status}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        busy={busy}
        title="Hapus foto hero"
        message={toDelete ? `Hapus foto ${toDelete.index + 1} (${toDelete.photo.alt})? Tindakan ini tidak bisa dibatalkan.` : ""}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          setBusy(true);
          const ok = await hero.remove(toDelete.photo.id);
          setBusy(false);
          if (ok) setToDelete(null);
        }}
      />
    </SectionCard>
  );
}
