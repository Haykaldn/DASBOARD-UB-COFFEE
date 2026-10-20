"use client";

import { useState } from "react";
import { DAY_NAMES, formatPhone, hhmm, isHttpsUrl, normalizePhone, toMinutes, uid } from "@/lib/format";
import type { DayHours, Outlet, SiteConfig } from "@/lib/types";
import { ConfirmDialog, FormDialog } from "../Dialog";
import { useOutlets } from "../data-hooks";
import Icon from "../Icon";
import { Button, Checkbox, EmptyState, Field, inputCls, SectionCard, StatusChip } from "../ui";

/** Ringkas jam buka: hari berurutan dengan jam sama digabung ("Senin – Jumat"). */
function summarizeHours(hours: DayHours[]): Array<{ days: string; time: string }> {
  const key = (h: DayHours) => (h.closed ? "Libur" : `${hhmm(h.open)} – ${hhmm(h.close)}`);
  const rows: Array<{ from: number; to: number; time: string }> = [];
  hours.forEach((h, i) => {
    const last = rows[rows.length - 1];
    if (last && last.time === key(h) && last.to === i - 1) last.to = i;
    else rows.push({ from: i, to: i, time: key(h) });
  });
  if (rows.length === 1) return [{ days: "Setiap hari", time: rows[0].time }];
  return rows.map((r) => ({
    days: r.from === r.to ? DAY_NAMES[r.from] : `${DAY_NAMES[r.from]} – ${DAY_NAMES[r.to]}`,
    time: r.time,
  }));
}

export default function OutletsSection({ site }: { site: SiteConfig }) {
  const { outlets, save, remove } = useOutlets(site.slug);
  const [editing, setEditing] = useState<Outlet | "new" | null>(null);

  return (
    <SectionCard
      id="lokasi"
      title="Lokasi & Jam Buka"
      description={
        site.slug === "brewi-jaya"
          ? "Nomor WA outlet dipakai tombol “Chat via WhatsApp” di section Reservasi website."
          : "Tab Lokasi (alamat, patokan, peta, jam buka) dan Jam Buka di footer website. Jam buka outlet pertama juga tampil di hero dan menentukan jam booking meeting room."
      }
      action={
        <Button icon="plus" onClick={() => setEditing("new")}>
          Tambah Outlet
        </Button>
      }
    >
      {outlets.length === 0 ? (
        <EmptyState
          text="Belum ada outlet. Tambah outlet pertama."
          action={
            <Button icon="plus" onClick={() => setEditing("new")}>
              Tambah Outlet
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {outlets.map((o) => (
            <li key={o.id} className="flex min-w-0 flex-col rounded-[16px] border border-line bg-white p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 font-bold break-words">{o.name}</h3>
                {!o.isActive && <StatusChip tone="mute">Nonaktif</StatusChip>}
              </div>
              <p className="flex gap-2 text-sm break-words text-ink-2">
                <Icon name="mapPin" size={16} className="mt-0.5 shrink-0 text-ink-3" />
                <span className="min-w-0">
                  {o.address}
                  {o.landmark && <span className="mt-0.5 block text-[13px] text-ink-3">{o.landmark}</span>}
                </span>
              </p>
              <dl className="mt-3 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                {summarizeHours(o.hours).map((r) => (
                  <div key={r.days} className="contents">
                    <dt className="text-ink-2">{r.days}</dt>
                    <dd className="font-medium tabular-nums">{r.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
                <Icon name="whatsapp" size={16} className="shrink-0 text-ink-3" />
                {formatPhone(o.whatsapp)}
              </p>
              <div className="mt-auto flex justify-end pt-3">
                <Button size="sm" icon="edit" onClick={() => setEditing(o)} aria-label={`Edit ${o.name}`}>
                  Edit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <OutletDialog
          key={editing === "new" ? "new" : editing.id}
          outlet={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </SectionCard>
  );
}

function OutletDialog({
  outlet,
  onClose,
  onSave,
  onDelete,
}: {
  outlet: Outlet | null;
  onClose: () => void;
  onSave: (v: Outlet) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [v, setV] = useState<Outlet>(
    outlet ?? {
      id: uid("o"),
      name: "",
      address: "",
      landmark: "",
      mapsUrl: "",
      whatsapp: "",
      isActive: true,
      hours: Array.from({ length: 7 }, () => ({ open: "08:00", close: "22:00", closed: false })),
    },
  );
  const [wa, setWa] = useState(outlet ? formatPhone(outlet.whatsapp) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const setDay = (i: number, patch: Partial<DayHours>) =>
    setV({ ...v, hours: v.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) });

  function validate(): Outlet | null {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = "Nama minimal 2 karakter.";
    if (v.address.trim().length < 5) e.address = "Isi alamat lengkap.";
    if (v.mapsUrl && !isHttpsUrl(v.mapsUrl)) e.mapsUrl = "Harus diawali https://";
    const phone = normalizePhone(wa);
    if (!phone) e.whatsapp = "Nomor tidak valid. Contoh: 0821-3224-5897";
    v.hours.forEach((h, i) => {
      if (!h.closed && (!h.open || !h.close || toMinutes(h.close) <= toMinutes(h.open)))
        e[`h${i}`] = "Jam tutup harus setelah jam buka.";
    });
    setErrors(e);
    if (Object.keys(e).length) return null;
    return {
      ...v,
      name: v.name.trim(),
      address: v.address.trim(),
      landmark: v.landmark.trim(),
      mapsUrl: v.mapsUrl.trim(),
      whatsapp: phone!,
    };
  }

  return (
    <>
      <FormDialog
        open={!confirmDel}
        wide
        onClose={onClose}
        title={outlet ? "Edit outlet" : "Tambah outlet"}
        description={outlet?.name}
        onSubmit={async () => {
          const out = validate();
          if (!out) return;
          setBusy(true);
          const ok = await onSave(out);
          setBusy(false);
          if (ok) onClose();
        }}
        footer={
          <>
            {outlet && (
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
          <Field label="Nama outlet" error={errors.name}>
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
          <Field label="Alamat" error={errors.address}>
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.address}
                rows={2}
                maxLength={240}
                value={v.address}
                onChange={(e) => setV({ ...v, address: e.target.value })}
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
          <Field label="Patokan" optional showOn="Di bawah alamat, tab Lokasi">
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                maxLength={120}
                value={v.landmark}
                onChange={(e) => setV({ ...v, landmark: e.target.value })}
                placeholder="Contoh: Dekat gerbang masuk KPRI UB"
                className={inputCls}
              />
            )}
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Link Google Maps" optional error={errors.mapsUrl} hint="Dipakai tombol “Buka di Google Maps” dan peta.">
              {(id, d) => (
                <input
                  id={id}
                  type="url"
                  inputMode="url"
                  aria-describedby={d}
                  aria-invalid={!!errors.mapsUrl}
                  value={v.mapsUrl}
                  onChange={(e) => setV({ ...v, mapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/…"
                  className={inputCls}
                />
              )}
            </Field>
            <Field label="Nomor WhatsApp" error={errors.whatsapp}>
              {(id, d) => (
                <input
                  id={id}
                  type="tel"
                  inputMode="tel"
                  aria-describedby={d}
                  aria-invalid={!!errors.whatsapp}
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="0821-3224-5897"
                  className={inputCls}
                />
              )}
            </Field>
          </div>
          <Checkbox
            label="Aktif (tampil di website)"
            checked={v.isActive}
            onChange={(isActive) => setV({ ...v, isActive })}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Jam buka</legend>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {v.hours.map((h, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                  <span className="w-16 shrink-0 text-sm font-semibold">{DAY_NAMES[i]}</span>
                  <div className="flex min-w-0 flex-1 basis-[200px] items-center gap-2">
                    <label className="sr-only" htmlFor={`open-${i}`}>
                      Jam buka {DAY_NAMES[i]}
                    </label>
                    <input
                      id={`open-${i}`}
                      type="time"
                      step={1800}
                      disabled={h.closed}
                      value={h.open}
                      onChange={(e) => setDay(i, { open: e.target.value })}
                      className={`${inputCls} min-w-0 px-2 disabled:bg-page disabled:text-ink-3`}
                    />
                    <span aria-hidden="true" className="text-ink-3">
                      –
                    </span>
                    <label className="sr-only" htmlFor={`close-${i}`}>
                      Jam tutup {DAY_NAMES[i]}
                    </label>
                    <input
                      id={`close-${i}`}
                      type="time"
                      step={1800}
                      disabled={h.closed}
                      value={h.close}
                      onChange={(e) => setDay(i, { close: e.target.value })}
                      className={`${inputCls} min-w-0 px-2 disabled:bg-page disabled:text-ink-3`}
                    />
                  </div>
                  <Checkbox
                    label="Libur"
                    checked={h.closed}
                    onChange={(closed) => setDay(i, closed ? { closed } : { closed, open: h.open || "08:00", close: h.close || "22:00" })}
                  />
                  {errors[`h${i}`] && <p className="w-full text-[13px] font-medium text-danger">{errors[`h${i}`]}</p>}
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      </FormDialog>
      <ConfirmDialog
        open={confirmDel}
        busy={busy}
        title="Hapus outlet"
        message={`Hapus ${outlet?.name}? Tindakan ini tidak bisa dibatalkan.`}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          if (!outlet) return;
          setBusy(true);
          const ok = await onDelete(outlet.id);
          setBusy(false);
          if (ok) onClose();
        }}
      />
    </>
  );
}
