"use client";

import { useState, type ReactNode } from "react";
import {
  BUFFER_MIN,
  findConflict,
  isPast,
  openRange,
  roomOf,
  ROOMS,
  statusLabel,
  statusTone,
  timeSlots,
  waKindFor,
  waLink,
} from "@/lib/booking";
import { formatDateLong, formatDateTime, formatPhone, hhmm, normalizePhone, todayISO, toMinutes } from "@/lib/format";
import type { Booking, ManualBookingInput, Outlet, RoomId } from "@/lib/types";
import { FormDialog } from "../Dialog";
import Icon from "../Icon";
import { Button, cx, Field, inputCls, StatusChip } from "../ui";

function Summary({ b }: { b: Booking }) {
  const rows: Array<[string, ReactNode]> = b.isInternal
    ? [
        ["Ruang", roomOf(b.roomId).name],
        ["Tanggal", formatDateLong(b.date)],
        ["Jam", `${hhmm(b.start)} – ${hhmm(b.end)}`],
        ["Keterangan", b.purpose],
      ]
    : [
        ["Kode", b.code],
        ["Pemesan", b.name],
        ["No. WhatsApp", b.phone ? formatPhone(b.phone) : "—"],
        ["Sumber", b.source === "ADMIN" ? "Diinput admin" : "Form website"],
        ...(b.email ? ([["Email", b.email]] as Array<[string, ReactNode]>) : []),
        ...(b.organization ? ([["Instansi", b.organization]] as Array<[string, ReactNode]>) : []),
        ["Keperluan", b.purpose],
        ["Ruang", roomOf(b.roomId).name],
        ["Tanggal", formatDateLong(b.date)],
        ["Jam", `${hhmm(b.start)} – ${hhmm(b.end)}`],
        ["Peserta", `${b.pax} orang (kapasitas ${roomOf(b.roomId).capacity})`],
        ...(b.note ? ([["Catatan pemesan", b.note]] as Array<[string, ReactNode]>) : []),
      ];
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl bg-page p-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-3">{k}</dt>
          <dd className="font-medium break-words text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function WaButton({ b, label = "Kirim WA ke pemesan" }: { b: Booking; label?: string }) {
  if (!b.phone) return null;
  return (
    <a
      href={waLink(b, waKindFor(b))}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-700 bg-green-700 px-4 text-sm font-semibold whitespace-nowrap text-white hover:bg-green-800"
    >
      <Icon name="whatsapp" size={18} />
      {label}
      <span className="sr-only">(membuka WhatsApp di tab baru)</span>
    </a>
  );
}

/* ---------------- Konfirmasi ---------------- */

export function ConfirmBookingDialog({
  booking,
  onClose,
  onSubmit,
}: {
  booking: Booking | null;
  onClose: () => void;
  onSubmit: (note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  const close = () => {
    setNote("");
    setDone(null);
    onClose();
  };

  const b = done ?? booking;
  if (!b) return null;

  return (
    <FormDialog
      open
      onClose={close}
      title={done ? "Booking dikonfirmasi" : "Konfirmasi booking"}
      description={done ? "Kabari pemesan lewat WhatsApp." : "Periksa data sebelum mengonfirmasi."}
      onSubmit={
        done
          ? undefined
          : async () => {
              setBusy(true);
              const ok = await onSubmit(note.trim());
              setBusy(false);
              if (ok) setDone({ ...b, status: "CONFIRMED", adminNote: note.trim() });
            }
      }
      footer={
        done ? (
          <>
            <Button onClick={close}>Tutup</Button>
            <WaButton b={done} />
          </>
        ) : (
          <>
            <Button onClick={close}>Batal</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Konfirmasi"}
            </Button>
          </>
        )
      }
    >
      <Summary b={b} />
      {!done && (
        <div className="mt-4">
          <Field label="Catatan admin" optional hint="Ikut dikirim di pesan WhatsApp ke pemesan.">
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                rows={3}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Proyektor sudah kami siapkan."
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
        </div>
      )}
    </FormDialog>
  );
}

/* ---------------- Tolak / Batalkan (alasan) ---------------- */

export function ReasonDialog({
  booking,
  mode,
  onClose,
  onSubmit,
}: {
  booking: Booking | null;
  mode: "reject" | "cancel";
  onClose: () => void;
  onSubmit: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!booking) return null;

  const isBlock = booking.isInternal;
  const required = mode === "reject";
  const title = mode === "reject" ? "Tolak booking" : isBlock ? "Hapus blokir jadwal" : "Batalkan booking";
  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <FormDialog
      open
      onClose={close}
      title={title}
      description={
        isBlock ? "Slot akan terbuka lagi untuk booking dari website." : `${booking.name} · ${booking.code}`
      }
      onSubmit={async () => {
        if (required && reason.trim().length < 5) {
          setError("Alasan wajib diisi (minimal 5 karakter).");
          return;
        }
        setBusy(true);
        const ok = await onSubmit(reason.trim());
        setBusy(false);
        if (ok) close();
      }}
      footer={
        <>
          <Button onClick={close}>Kembali</Button>
          <Button type="submit" variant="primary" className="!border-danger !bg-danger hover:!bg-red-800" disabled={busy}>
            {busy ? "Menyimpan…" : mode === "reject" ? "Tolak" : isBlock ? "Hapus blokir" : "Batalkan booking"}
          </Button>
        </>
      }
    >
      {!isBlock && (
        <p className="mb-4 text-sm text-ink-2">
          {formatDateLong(booking.date)} · {hhmm(booking.start)} – {hhmm(booking.end)} · {booking.pax} orang
        </p>
      )}
      {!isBlock && (
        <Field
          label={mode === "reject" ? "Alasan penolakan" : "Alasan pembatalan"}
          optional={!required}
          hint="Disampaikan ke pemesan lewat WhatsApp."
          error={error}
        >
          {(id, d) => (
            <textarea
              id={id}
              aria-describedby={d}
              aria-invalid={!!error}
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              className={`${inputCls} py-2.5`}
            />
          )}
        </Field>
      )}
      {isBlock && (
        <p className="text-[15px] text-ink-2">
          Hapus blokir “{booking.purpose}” pada {formatDateLong(booking.date)}, {hhmm(booking.start)} – {hhmm(booking.end)}?
        </p>
      )}
    </FormDialog>
  );
}

/* ---------------- Detail ---------------- */

export function DetailDialog({
  booking,
  onClose,
  onConfirm,
  onReject,
  onCancel,
  onMark,
}: {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onCancel: () => void;
  onMark: (to: "COMPLETED" | "NO_SHOW") => void;
}) {
  if (!booking) return null;
  const b = booking;
  const past = isPast(b);

  let actions: ReactNode = <Button onClick={onClose}>Tutup</Button>;
  if (b.status === "PENDING") {
    actions = (
      <>
        <Button variant="danger" onClick={onReject}>
          Tolak
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Konfirmasi
        </Button>
      </>
    );
  } else if (b.status === "CONFIRMED" && b.isInternal) {
    actions = (
      <>
        <Button onClick={onClose}>Tutup</Button>
        <Button variant="danger" onClick={onCancel}>
          Hapus blokir
        </Button>
      </>
    );
  } else if (b.status === "CONFIRMED") {
    actions = (
      <>
        <Button variant="danger" onClick={onCancel}>
          Batalkan
        </Button>
        <Button onClick={() => onMark("NO_SHOW")} disabled={!past}>
          Tidak Hadir
        </Button>
        <Button onClick={() => onMark("COMPLETED")} disabled={!past}>
          Tandai Selesai
        </Button>
        <WaButton b={b} label="Kirim WA" />
      </>
    );
  } else if (!b.isInternal && (b.status === "REJECTED" || b.status === "CANCELLED")) {
    actions = (
      <>
        <Button onClick={onClose}>Tutup</Button>
        <WaButton b={b} label="Kirim WA" />
      </>
    );
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      wide
      title={b.isInternal ? "Detail blokir jadwal" : "Detail booking"}
      description={<StatusChip tone={statusTone(b)}>{statusLabel(b)}</StatusChip>}
      footer={actions}
    >
      <Summary b={b} />
      {b.status === "CONFIRMED" && !b.isInternal && !past && (
        <p className="mt-3 text-[13px] text-ink-3">
          “Tandai Selesai” dan “Tidak Hadir” aktif setelah jadwal berakhir.
        </p>
      )}
      {b.adminNote && (
        <div className="mt-4">
          <h3 className="mb-1 text-sm font-semibold">Catatan admin</h3>
          <p className="text-sm break-words text-ink-2">{b.adminNote}</p>
        </div>
      )}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold">Riwayat status</h3>
        <ol className="space-y-3 border-l-2 border-line pl-4">
          {b.history
            .slice()
            .reverse()
            .map((h, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-sidebar-active" aria-hidden="true" />
                <p className="font-semibold">{h.label}</p>
                <p className="text-[13px] text-ink-3">
                  {formatDateTime(h.at)} · {h.by}
                </p>
                {h.note && <p className="mt-0.5 break-words text-ink-2">{h.note}</p>}
              </li>
            ))}
        </ol>
      </div>
    </FormDialog>
  );
}

/* ---------------- Booking jadwal (input admin) ---------------- */

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
    else if (pax > room.capacity) e.pax = `Kapasitas ${room.name} maksimal ${room.capacity} orang.`;
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
          <Field label="Jumlah peserta" error={errors.pax} hint={`Kapasitas ${room.name}: ${room.capacity} orang.`}>
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
                    {r.kind} · maks. {r.capacity} orang
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
