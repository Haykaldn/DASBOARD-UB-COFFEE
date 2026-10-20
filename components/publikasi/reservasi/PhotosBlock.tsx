"use client";

import { useState } from "react";
import type { Photo, SiteConfig } from "@/lib/types";
import { useMeetingRoomInfo } from "../../data-hooks";
import { ConfirmDialog } from "../../Dialog";
import Icon from "../../Icon";
import { UPLOAD_RULE, useImageUpload } from "../../ImageUploader";
import PhotoView from "../../PhotoView";
import SortableGrid from "../../SortableGrid";
import { Button, EmptyState } from "../../ui";
import { SubHeading } from "./SubHeading";

/** Foto ruangan: tambah, urutkan, hapus. */
export function PhotosBlock({ site, photos }: { site: SiteConfig; photos: Photo[] }) {
  const room = useMeetingRoomInfo(site.slug);
  const [toDelete, setToDelete] = useState<{ photo: Photo; index: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = useImageUpload((added) => void room.addPhotos(added), { multiple: true });

  return (
    <div>
      <SubHeading
        title="Foto ruangan"
        description={`${photos.length} foto, tampil bergantian di kolom kanan tab Reservasi.`}
        action={
          <Button size="sm" icon="plus" onClick={upload.trigger} disabled={upload.busy}>
            Tambah Foto
          </Button>
        }
      />
      {photos.length === 0 ? (
        <EmptyState
          text="Belum ada foto ruangan. Tambah foto pertama."
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
          getLabel={(p, i) => `foto ruangan ${i + 1} (${p.alt})`}
          onReorder={room.reorderPhotos}
          className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
          renderItem={(p, i, handle) => (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-page">
              <PhotoView photo={p} />
              <span className="absolute top-2 left-2 grid h-7 min-w-7 place-items-center rounded-lg bg-ink/80 px-1.5 text-xs font-bold text-white tabular-nums">
                {i + 1}
              </span>
              <div className="absolute right-2 bottom-2 left-2 flex justify-between gap-2">
                {handle}
                <button
                  type="button"
                  aria-label={`Hapus foto ruangan ${i + 1} (${p.alt})`}
                  title="Hapus foto"
                  onClick={() => setToDelete({ photo: p, index: i })}
                  className="grid size-10 place-items-center rounded-lg bg-white/90 text-danger shadow-sm hover:bg-white"
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </div>
          )}
        />
      )}
      {upload.status}
      <p className="mt-3 text-[13px] text-ink-3">
        Seret pegangan <Icon name="grip" size={14} className="inline align-[-2px]" /> untuk mengubah urutan. Disarankan foto
        landscape. {UPLOAD_RULE}
      </p>

      <ConfirmDialog
        open={!!toDelete}
        busy={busy}
        title="Hapus foto ruangan"
        message={toDelete ? `Hapus foto ${toDelete.index + 1} (${toDelete.photo.alt})? Tindakan ini tidak bisa dibatalkan.` : ""}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          setBusy(true);
          const ok = await room.removePhoto(toDelete.photo.id);
          setBusy(false);
          if (ok) setToDelete(null);
        }}
      />
    </div>
  );
}
