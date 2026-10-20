"use client";

import { useState } from "react";
import { BUFFER_MIN, findConflict, openRange, overCapacity, roomOf, ROOMS, timeSlots } from "@/lib/booking";
import { hhmm, normalizePhone, todayISO, toMinutes } from "@/lib/format";
import type { Booking, ManualBookingInput, Outlet, RoomId } from "@/lib/types";
import { FormDialog } from "../../Dialog";
import { Button, cx, Field, inputCls } from "../../ui";

/**
 * Admin memasukkan booking atas nama pemesan yang reservasi langsung ke UB Coffee
 * (mis. pihak internal UB lewat telepon/WA/datang). Langsung berstatus Dikonfirmasi.
 */
export function ManualBookingDialog({
  open,
  initialDate,
  initialRoom,
  bookings,
  outlet,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialDate: string;
  initialRoom: RoomId;
  bookings: Booking[];
  outlet: Outlet | undefined;
  onClose: () => void;
  onSubmit: (v: ManualBookingInput) => Promise<boolean>;
}) {
  const empty = { name: "", phone: "", organization: "", purpose: "", start: "09:00", end: "11:00", pax: "", note: "" };
  const [v, setV] = useState(empty);
  const [date, setDate] = useState(initialDate);
  const [roomId, setRoomId] = useState<RoomId>(initialRoom);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [lastInitial, setLastInitial] = useState(`${initialDate}|${initialRoom}`);

  // Sinkronkan tanggal & ruang awal saat dialog dibuka dari kalender (klik slot kosong).
  if (`${initialDate}|${initialRoom}` !== lastInitial) {
    setLastInitial(`${initialDate}|${initialRoom}`);
    setDate(initialDate);
    setRoomId(initialRoom);
  }

  if (!open) return null;

  const room = roomOf(roomId);
  const range = openRange(outlet, date);
  const slots = timeSlots();
  const set = (k: keyof typeof empty, val: string) => setV({ ...v, [k]: val });

  function validate(): ManualBookingInput | null {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = "Isi nama pemesan.";
    const phone = v.phone.trim() ? normalizePhone(v.phone) : "";
    if (phone === null) e.phone = "Nomor tidak valid. Contoh: 0812-3456-7890";
    if (v.purpose.trim().length < 3) e.purpose = "Isi keperluan (minimal 3 karakter).";
    const pax = Number(v.pax);
    if (!Number.isInteger(pax) || pax < 1) e.pax = "Isi jumlah peserta.";
    else if (overCapacity(room, pax)) e.pax = `Kapasitas ${room.name} maksimal ${room.capacity} orang.`;
    if (!date) e.date = "Pilih tanggal.";
    else if (date < todayISO()) e.date = "Tanggal sudah lewat.";
    else if (!range) e.date = "UB Coffee libur pada tanggal ini.";
    if (toMinutes(v.end) <= toMinutes(v.start)) e.end = "Jam selesai harus setelah jam mulai.";
    else if (range && (toMinutes(v.start) < range.open || toMinutes(v.end) > range.close))
      e.end = `Di luar jam buka (${hhmm(slotOf(range.open))} – ${hhmm(slotOf(range.close))}).`;
    if (!e.date && !e.end) {
      const c = findConflict(bookings, roomId, date, v.start, v.end);
      if (c) e.end = `${room.name} sudah terpakai “${c.name}” ${hhmm(c.start)} – ${hhmm(c.end)} (termasuk jeda ${BUFFER_MIN} menit). Pilih jam atau ruang lain.`;
    }
    setErrors(e);
    if (Object.keys(e).length) return null;
    return {
      roomId,
      name: v.name.trim(),
      phone: phone ?? "",
      organization: v.organization.trim(),
      purpose: v.purpose.trim(),
      date,
      start: v.start,
      end: v.end,
      pax,
      note: v.note.trim(),
    };
  }

  const close = () => {
    setErrors({});
    setV(empty);
    onClose();
  };

  return (
    <FormDialog
      open={open}
      wide
      onClose={close}
      title="Booking jadwal"
      description="Masukkan reservasi yang diterima langsung oleh UB Coffee (mis. dari pihak internal). Booking langsung berstatus Dikonfirmasi dan menutup slot di website."
      onSubmit={async () => {
        const out = validate();
        if (!out) return;
        setBusy(true);
        const ok = await onSubmit(out);
        setBusy(false);
        if (ok) close();
      }}
      footer={
        <>
          <Button onClick={close}>Batal</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan booking"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama pemesan" error={errors.name}>
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.name}
                maxLength={80}
                value={v.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="No. WhatsApp" optional error={errors.phone} hint="Untuk kirim konfirmasi lewat WhatsApp.">
            {(id, d) => (
              <input
                id={id}
                type="tel"
                inputMode="tel"
                aria-describedby={d}
                aria-invalid={!!errors.phone}
                value={v.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0812-3456-7890"
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Instansi / unit" optional>
            {(id) => (
              <input
                id={id}
                maxLength={100}
                value={v.organization}
                onChange={(e) => set("organization", e.target.value)}
                placeholder="Contoh: PT Brawijaya Multi Usaha"
                className={inputCls}
              />
            )}
          </Field>
          <Field
            label="Jumlah peserta"
            error={errors.pax}
            hint={room.capacity === undefined ? undefined : `Kapasitas ${room.name}: ${room.capacity} orang.`}
          >
            {(id, d) => (
              <input
                id={id}
                inputMode="numeric"
                aria-describedby={d}
                aria-invalid={!!errors.pax}
                value={v.pax}
                onChange={(e) => set("pax", e.target.value.replace(/\D/g, "").slice(0, 3))}
                className={inputCls}
              />
            )}
          </Field>
        </div>
        <Field label="Keperluan" error={errors.purpose}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.purpose}
              maxLength={200}
              value={v.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="Contoh: Rapat koordinasi unit bisnis"
              className={inputCls}
            />
          )}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-bold text-navy">Ruang</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {ROOMS.map((r) => (
              <label
                key={r.id}
                className={cx(
                  "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  r.id === roomId ? "border-navy bg-navy/5" : "border-line hover:bg-page",
                )}
              >
                <input
                  type="radio"
                  name="room"
                  value={r.id}
                  checked={r.id === roomId}
                  onChange={() => setRoomId(r.id)}
                  className="mt-0.5 size-4 accent-navy"
                />
                <span className="min-w-0">
                  <span className="block font-bold text-navy">{r.name}</span>
                  <span className="block text-xs text-ink-3">
                    {r.capacity === undefined ? r.kind : `${r.kind} · maks. ${r.capacity} orang`}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tanggal" error={errors.date}>
            {(id, d) => (
              <input
                id={id}
                type="date"
                aria-describedby={d}
                aria-invalid={!!errors.date}
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            )}
          </Field>
          <Field label="Jam mulai">
            {(id) => (
              <select id={id} value={v.start} onChange={(e) => set("start", e.target.value)} className={inputCls}>
                {slots.slice(0, -1).map((s) => (
                  <option key={s} value={s}>
                    {hhmm(s)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Jam selesai">
            {(id, d) => (
              <select
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.end}
                value={v.end}
                onChange={(e) => set("end", e.target.value)}
                className={inputCls}
              >
                {slots.slice(1).map((s) => (
                  <option key={s} value={s}>
                    {hhmm(s)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        {errors.end && <p className="-mt-2 text-[13px] font-medium text-danger">{errors.end}</p>}
        <Field label="Catatan" optional>
          {(id) => (
            <textarea
              id={id}
              rows={2}
              maxLength={300}
              value={v.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Contoh: Paket Mini Coffee Break & 2 Snack, 12 orang."
              className={`${inputCls} py-2.5`}
            />
          )}
        </Field>
      </div>
    </FormDialog>
  );
}

function slotOf(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
