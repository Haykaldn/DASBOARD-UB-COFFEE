"use client";

import { useState } from "react";
import { uid } from "@/lib/format";
import type { MeetingRoomInfo, RentalPrice, SiteConfig } from "@/lib/types";
import { useMeetingRoomInfo } from "../../data-hooks";
import { useDirtyGuard } from "../../store";
import { Button, Field, IconButton, inputCls } from "../../ui";
import { SubHeading } from "./SubHeading";

/* Informasi & harga sewa */

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

export function InfoForm({ site, info }: { site: SiteConfig; info: MeetingRoomInfo }) {
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
