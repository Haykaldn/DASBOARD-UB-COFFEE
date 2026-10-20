"use client";

import { useState } from "react";
import type { GalleryItem, SiteConfig } from "@/lib/types";
import { useGallery } from "../data-hooks";
import { ConfirmDialog, FormDialog } from "../Dialog";
import Icon from "../Icon";
import { PhotoField, UPLOAD_RULE, useImageUpload } from "../ImageUploader";
import PhotoView from "../PhotoView";
import SortableGrid from "../SortableGrid";
import { Button, EmptyState, Field, inputCls, SectionCard } from "../ui";

export default function GallerySection({ site }: { site: SiteConfig }) {
  const gallery = useGallery(site.slug);
  const items = gallery.items;
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  const upload = useImageUpload(
    (photos) => void gallery.add(photos),
    { multiple: true },
  );

  return (
    <SectionCard
      id="galeri"
      title="Galeri"
      description={`${items.length} foto di section Galeri website.`}
      action={
        <Button icon="upload" onClick={upload.trigger} disabled={upload.busy}>
          Unggah Foto
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          text="Belum ada foto galeri. Unggah foto pertama."
          action={
            <Button icon="upload" onClick={upload.trigger}>
              Unggah Foto
            </Button>
          }
        />
      ) : (
        <SortableGrid
          items={items}
          getId={(g) => g.id}
          getLabel={(g, i) => g.caption || `foto ${i + 1}`}
          onReorder={gallery.reorder}
          className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
          renderItem={(g, i, handle) => (
            <figure className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="relative aspect-square bg-page">
                <PhotoView photo={g.photo} />
                <div className="absolute inset-x-2 bottom-2 flex justify-between gap-2">
                  {handle}
                  <button
                    type="button"
                    onClick={() => setEditing(g)}
                    aria-label={`Edit ${g.caption || `foto ${i + 1}`}`}
                    title="Edit"
                    className="grid size-10 place-items-center rounded-lg bg-white/90 text-ink-2 shadow-sm hover:bg-white hover:text-ink"
                  >
                    <Icon name="edit" size={18} />
                  </button>
                </div>
              </div>
              <figcaption className="px-3 py-2 text-[13px] break-words text-ink-2">
                {g.caption || <span className="text-ink-3 italic">Tanpa keterangan</span>}
              </figcaption>
            </figure>
          )}
        />
      )}
      {upload.status}
      <p className="mt-3 text-[13px] text-ink-3">Seret pegangan untuk mengubah urutan. {UPLOAD_RULE}</p>

      {editing && (
        <GalleryDialog
          key={editing.id}
          item={editing}
          onClose={() => setEditing(null)}
          onSave={gallery.update}
          onDelete={gallery.remove}
        />
      )}
    </SectionCard>
  );
}

function GalleryDialog({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: GalleryItem;
  onClose: () => void;
  onSave: (v: GalleryItem) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [v, setV] = useState(item);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const label = item.caption || "foto ini";

  return (
    <>
      <FormDialog
        open={!confirmDel}
        onClose={onClose}
        title="Edit foto galeri"
        onSubmit={async () => {
          setBusy(true);
          const ok = await onSave({ ...v, caption: v.caption.trim(), photo: { ...v.photo, alt: v.caption.trim() || v.photo.alt } });
          setBusy(false);
          if (ok) onClose();
        }}
        footer={
          <>
            <Button variant="danger" icon="trash" className="mr-auto" onClick={() => setConfirmDel(true)}>
              Hapus
            </Button>
            <Button onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <PhotoField label="Foto" aspect="aspect-square" photo={v.photo} onChange={(p) => p && setV({ ...v, photo: p })} />
          <Field label="Keterangan" optional hint="Tampil di bawah foto dan dipakai sebagai teks alternatif.">
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                maxLength={120}
                value={v.caption}
                onChange={(e) => setV({ ...v, caption: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog
        open={confirmDel}
        busy={busy}
        title="Hapus foto galeri"
        message={`Hapus ${label}? Tindakan ini tidak bisa dibatalkan.`}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          setBusy(true);
          const ok = await onDelete(item.id);
          setBusy(false);
          if (ok) onClose();
        }}
      />
    </>
  );
}
