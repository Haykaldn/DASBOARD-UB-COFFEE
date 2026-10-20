"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { rupiah, uid } from "@/lib/format";
import type { MeetingPackage, MeetingRoomInfo, Photo, RentalPrice, SiteConfig } from "@/lib/types";
import { ConfirmDialog, FormDialog } from "../Dialog";
import Icon from "../Icon";
import { UPLOAD_RULE, useImageUpload } from "../ImageUploader";
import PhotoView from "../PhotoView";
import { useMeetingRoomInfo } from "../data-hooks";
import SortableGrid from "../SortableGrid";
import { useDirtyGuard } from "../store";
import { Button, EmptyState, Field, IconButton, inputCls, SectionCard } from "../ui";

/** Tab "Reservasi" website UB Coffee: informasi meeting room, harga sewa, foto, dan paket. */
export default function ReservasiSection({ site }: { site: SiteConfig }) {
  const { info } = useMeetingRoomInfo(site.slug);
  if (!info) return null;

  return (
    <SectionCard
      id="reservasi"
      title="Reservasi Meeting Room"
      description="Isi tab Reservasi website: informasi ruangan, harga sewa, foto, dan paket meeting."
      action={
        <Link
          href="/meeting-room"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:bg-page"
        >
          <Icon name="calendar" size={18} />
          Kelola jadwal booking
        </Link>
      }
    >
      <div className="grid gap-8">
        <InfoForm site={site} info={info} />
        <PhotosBlock site={site} photos={info.photos} />
        <PackagesBlock site={site} info={info} />
      </div>
    </SectionCard>
  );
}

function SubHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
      <div className="min-w-0 flex-1 basis-[220px]">
        <h3 className="font-bold">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Informasi & harga sewa ---------- */

type InfoValues = {
  description: string;
  capacity: string;
  rentalPrices: Array<{ id: string; label: string; price: string }>;
  facilities: string;
  snackInfo: string;
  orderingNote: string;
};

const toForm = (m: MeetingRoomInfo): InfoValues => ({
  description: m.description,
  capacity: String(m.capacity),
  rentalPrices: m.rentalPrices.map((r) => ({ id: r.id, label: r.label, price: String(r.price) })),
  facilities: m.facilities.join("\n"),
  snackInfo: m.snackInfo,
  orderingNote: m.orderingNote,
});

function InfoForm({ site, info }: { site: SiteConfig; info: MeetingRoomInfo }) {
  const { update } = useMeetingRoomInfo(site.slug);
  const saved = toForm(info);
  const [form, setForm] = useState<InfoValues>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useDirtyGuard(`reservasi-${site.slug}`, dirty);

  const set = <K extends keyof InfoValues>(k: K, v: InfoValues[K]) => setForm({ ...form, [k]: v });
  const setPrice = (id: string, patch: Partial<InfoValues["rentalPrices"][number]>) =>
    set(
      "rentalPrices",
      form.rentalPrices.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  function validate() {
    const e: Record<string, string> = {};
    if (form.description.trim().length < 10) e.description = "Deskripsi minimal 10 karakter.";
    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 200) e.capacity = "Isi angka 1–200.";
    if (form.rentalPrices.length === 0) e.rentalPrices = "Minimal satu harga sewa.";
    form.rentalPrices.forEach((r) => {
      if (r.label.trim().length < 2 || !(Number(r.price) > 0)) e.rentalPrices = "Isi nama dan harga setiap baris harga sewa.";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const rentalPrices: RentalPrice[] = form.rentalPrices.map((r) => ({ id: r.id, label: r.label.trim(), price: Number(r.price) }));
        const facilities = form.facilities
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean);
        const fields = {
          description: form.description.trim(),
          capacity: Number(form.capacity),
          rentalPrices,
          facilities,
          snackInfo: form.snackInfo.trim(),
          orderingNote: form.orderingNote.trim(),
        };
        setBusy(true);
        const ok = await update(fields);
        setBusy(false);
        if (ok) setForm(toForm({ ...info, ...fields }));
      }}
    >
      <SubHeading title="Informasi & harga sewa" description="Kolom kiri tab Reservasi dan keterangan di bawah paket." />
      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
          <Field label="Deskripsi" error={errors.description} showOn="Di bawah judul “Ruang meeting yang nyaman”" hint={`${form.description.length}/600 karakter`}>
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.description}
                rows={4}
                maxLength={600}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
          <Field label="Kapasitas (orang)" error={errors.capacity} showOn="Lencana “Hingga … orang” di foto">
            {(id, d) => (
              <input
                id={id}
                inputMode="numeric"
                aria-describedby={d}
                aria-invalid={!!errors.capacity}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value.replace(/\D/g, "").slice(0, 3))}
                className={inputCls}
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Harga sewa</legend>
          <ul className="grid gap-2">
            {form.rentalPrices.map((r, i) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`rp-label-${r.id}`}>
                  Nama harga {i + 1}
                </label>
                <input
                  id={`rp-label-${r.id}`}
                  value={r.label}
                  maxLength={40}
                  onChange={(e) => setPrice(r.id, { label: e.target.value })}
                  placeholder="Contoh: Internal UB"
                  className={`${inputCls} min-w-0 flex-1 basis-[180px]`}
                />
                <label className="sr-only" htmlFor={`rp-price-${r.id}`}>
                  Harga {r.label || i + 1} (Rp)
                </label>
                <div className="relative min-w-0 flex-1 basis-[140px]">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">Rp</span>
                  <input
                    id={`rp-price-${r.id}`}
                    inputMode="numeric"
                    value={r.price}
                    onChange={(e) => setPrice(r.id, { price: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                    placeholder="100000"
                    className={`${inputCls} pl-10 tabular-nums`}
                  />
                </div>
                <IconButton
                  icon="trash"
                  label={`Hapus harga ${r.label || i + 1}`}
                  onClick={() =>
                    set(
                      "rentalPrices",
                      form.rentalPrices.filter((x) => x.id !== r.id),
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            icon="plus"
            className="mt-2"
            onClick={() => set("rentalPrices", [...form.rentalPrices, { id: uid("rp"), label: "", price: "" }])}
          >
            Tambah harga
          </Button>
          {errors.rentalPrices && <p className="mt-1.5 text-[13px] font-medium text-danger">{errors.rentalPrices}</p>}
        </fieldset>

        <Field label="Fasilitas gratis" optional hint="Satu fasilitas per baris." showOn="Daftar centang di bawah harga sewa">
          {(id, d) => (
            <textarea
              id={id}
              aria-describedby={d}
              rows={3}
              value={form.facilities}
              onChange={(e) => set("facilities", e.target.value)}
              className={`${inputCls} py-2.5`}
            />
          )}
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Pilihan snack" optional showOn="“Pilihan snack favorit” di bawah paket">
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                rows={4}
                maxLength={400}
                value={form.snackInfo}
                onChange={(e) => set("snackInfo", e.target.value)}
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
          <Field label="Cara pemesanan" optional showOn="“Cara pemesanan” di bawah paket">
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                rows={4}
                maxLength={400}
                value={form.orderingNote}
                onChange={(e) => set("orderingNote", e.target.value)}
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {dirty && <p className="text-[13px] text-warn-fg">Ada perubahan yang belum disimpan.</p>}
          {dirty && (
            <Button
              onClick={() => {
                setForm(saved);
                setErrors({});
              }}
            >
              Batalkan perubahan
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={busy || !dirty}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ---------- Foto ruangan ---------- */

function PhotosBlock({ site, photos }: { site: SiteConfig; photos: Photo[] }) {
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

/* ---------- Paket meeting ---------- */

function PackagesBlock({ site, info }: { site: SiteConfig; info: MeetingRoomInfo }) {
  const room = useMeetingRoomInfo(site.slug);
  const [editing, setEditing] = useState<MeetingPackage | "new" | null>(null);
  const [note, setNote] = useState(info.packagesNote);
  const [busy, setBusy] = useState(false);
  const noteDirty = note.trim() !== info.packagesNote;
  useDirtyGuard(`paket-note-${site.slug}`, noteDirty);

  return (
    <div>
      <SubHeading
        title="Paket meeting"
        description="Kartu “Pilihan paket.” di tab Reservasi. Tombol “Pesan paket” membuka WhatsApp."
        action={
          <Button size="sm" icon="plus" onClick={() => setEditing("new")}>
            Tambah Paket
          </Button>
        }
      />

      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await room.update({ packagesNote: note.trim() });
          setBusy(false);
        }}
        className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
      >
        <Field label="Keterangan paket" optional showOn="Di bawah judul “Pilihan paket.”">
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
            />
          )}
        </Field>
        <Button type="submit" disabled={busy || !noteDirty} className="sm:mt-[26px]">
          {busy ? "Menyimpan…" : "Simpan"}
        </Button>
      </form>

      {info.packages.length === 0 ? (
        <EmptyState
          text="Belum ada paket meeting."
          action={
            <Button icon="plus" onClick={() => setEditing("new")}>
              Tambah Paket
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {info.packages.map((p) => (
            <li key={p.id} className="flex min-w-0 flex-col rounded-[16px] border border-line bg-white p-4">
              <h4 className="font-bold break-words">{p.name}</h4>
              <p className="mt-1 text-sm text-ink-2">{p.description}</p>
              <p className="mt-3 text-sm">
                <strong className="text-base tabular-nums">{rupiah(p.price)}</strong>{" "}
                <span className="text-ink-2">/ {p.minPax} orang</span>
              </p>
              <p className="text-[13px] text-ink-2 tabular-nums">Tambahan per orang: {rupiah(p.extraPerPax)}</p>
              <div className="mt-auto flex justify-end pt-3">
                <Button size="sm" icon="edit" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                  Edit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <PackageDialog
          key={editing === "new" ? "new" : editing.id}
          pkg={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={room.savePackage}
          onDelete={room.removePackage}
        />
      )}
    </div>
  );
}

function PackageDialog({
  pkg,
  onClose,
  onSave,
  onDelete,
}: {
  pkg: MeetingPackage | null;
  onClose: () => void;
  onSave: (v: MeetingPackage) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [v, setV] = useState({
    name: pkg?.name ?? "",
    description: pkg?.description ?? "",
    price: pkg ? String(pkg.price) : "",
    minPax: pkg ? String(pkg.minPax) : "10",
    extraPerPax: pkg ? String(pkg.extraPerPax) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const digits = (s: string, n: number) => s.replace(/\D/g, "").slice(0, n);

  function validate() {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 3) e.name = "Nama minimal 3 karakter.";
    if (!(Number(v.price) > 0)) e.price = "Isi harga paket, contoh 400000.";
    const min = Number(v.minPax);
    if (!Number.isInteger(min) || min < 1) e.minPax = "Isi jumlah orang minimal 1.";
    if (v.extraPerPax === "") e.extraPerPax = "Isi 0 jika tidak ada tambahan.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <>
      <FormDialog
        open={!confirmDel}
        onClose={onClose}
        title={pkg ? "Edit paket meeting" : "Tambah paket meeting"}
        description={pkg?.name}
        onSubmit={async () => {
          if (!validate()) return;
          setBusy(true);
          const ok = await onSave({
            id: pkg?.id ?? uid("k"),
            name: v.name.trim(),
            description: v.description.trim(),
            price: Number(v.price),
            minPax: Number(v.minPax),
            extraPerPax: Number(v.extraPerPax),
          });
          setBusy(false);
          if (ok) onClose();
        }}
        footer={
          <>
            {pkg && (
              <Button variant="danger" icon="trash" className="mr-auto" onClick={() => setConfirmDel(true)}>
                Hapus
              </Button>
            )}
            <Button onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <Field label="Nama paket" error={errors.name}>
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.name}
                maxLength={80}
                value={v.name}
                onChange={(e) => setV({ ...v, name: e.target.value })}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Deskripsi" optional>
            {(id) => (
              <textarea
                id={id}
                rows={2}
                maxLength={200}
                value={v.description}
                onChange={(e) => setV({ ...v, description: e.target.value })}
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Harga paket (Rp)" error={errors.price} hint={v.price ? `Tampil: ${rupiah(Number(v.price))}` : undefined}>
              {(id, d) => (
                <input
                  id={id}
                  inputMode="numeric"
                  aria-describedby={d}
                  aria-invalid={!!errors.price}
                  value={v.price}
                  onChange={(e) => setV({ ...v, price: digits(e.target.value, 8) })}
                  placeholder="400000"
                  className={inputCls}
                />
              )}
            </Field>
            <Field label="Untuk (orang)" error={errors.minPax} hint="Harga paket berlaku untuk jumlah ini.">
              {(id, d) => (
                <input
                  id={id}
                  inputMode="numeric"
                  aria-describedby={d}
                  aria-invalid={!!errors.minPax}
                  value={v.minPax}
                  onChange={(e) => setV({ ...v, minPax: digits(e.target.value, 3) })}
                  className={inputCls}
                />
              )}
            </Field>
            <Field label="Tambahan per orang (Rp)" error={errors.extraPerPax}>
              {(id, d) => (
                <input
                  id={id}
                  inputMode="numeric"
                  aria-describedby={d}
                  aria-invalid={!!errors.extraPerPax}
                  value={v.extraPerPax}
                  onChange={(e) => setV({ ...v, extraPerPax: digits(e.target.value, 8) })}
                  placeholder="40000"
                  className={inputCls}
                />
              )}
            </Field>
          </div>
        </div>
      </FormDialog>
      <ConfirmDialog
        open={confirmDel}
        busy={busy}
        title="Hapus paket"
        message={`Hapus ${pkg?.name}? Tindakan ini tidak bisa dibatalkan.`}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          if (!pkg) return;
          setBusy(true);
          const ok = await onDelete(pkg.id);
          setBusy(false);
          if (ok) onClose();
        }}
      />
    </>
  );
}
