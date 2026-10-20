"use client";

import { useState } from "react";
import { rupiah, uid } from "@/lib/format";
import type { MeetingPackage, MeetingRoomInfo, SiteConfig } from "@/lib/types";
import { useMeetingRoomInfo } from "../../data-hooks";
import { ConfirmDialog, FormDialog } from "../../Dialog";
import { useDirtyGuard } from "../../store";
import { Button, EmptyState, Field, inputCls } from "../../ui";
import { SubHeading } from "./SubHeading";

/** Paket meeting: keterangan paket dan daftar paket. */
export function PackagesBlock({ site, info }: { site: SiteConfig; info: MeetingRoomInfo }) {
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
