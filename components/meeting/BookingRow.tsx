"use client";

import { roomOf, statusLabel, statusTone } from "@/lib/booking";
import { formatDateShort, formatPhone, hhmm } from "@/lib/format";
import type { Booking } from "@/lib/types";
import Icon from "../Icon";
import { Button, cx, StatusChip, type Tone } from "../ui";

const TILE: Record<Tone, string> = {
  warn: "bg-amber-50 text-amber-500",
  ok: "bg-emerald-50 text-emerald-600",
  mute: "bg-slate-100 text-slate-500",
  info: "bg-blue-50 text-blue-600",
  danger: "bg-red-50 text-red-500",
};

/**
 * Satu booking per baris. Urutan baca: siapa → kapan → untuk apa → kode & kontak.
 * Status di kanan atas, aksi di kanan bawah; di layar sempit aksi turun ke bawah.
 */
export default function BookingRow({
  booking: b,
  onConfirm,
  onReject,
  onDetail,
}: {
  booking: Booking;
  onConfirm: () => void;
  onReject: () => void;
  onDetail: () => void;
}) {
  const tone = statusTone(b);
  const meta = b.isInternal ? "Blokir internal" : [b.code, b.phone && formatPhone(b.phone)].filter(Boolean).join(" · ");

  return (
    <li className="rounded-2xl border border-line bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex gap-3.5">
        <span className={cx("hidden size-10 shrink-0 place-items-center rounded-xl sm:grid", TILE[tone])} aria-hidden="true">
          <Icon name={b.isInternal ? "ban" : "calendar"} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-extrabold break-words text-navy">{b.name}</span>
              {!b.isInternal && b.source === "ADMIN" && (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-fg">Input admin</span>
              )}
            </p>
            <StatusChip tone={tone} className="shrink-0">
              {statusLabel(b)}
            </StatusChip>
          </div>

          <p className="mt-1 text-sm font-semibold text-ink tabular-nums">
            {formatDateShort(b.date)} · {hhmm(b.start)} – {hhmm(b.end)}
            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 align-[1px] text-[11px] font-bold text-blue-800">
              <Icon name="mapPin" size={12} />
              {roomOf(b.roomId).name}
            </span>
            {!b.isInternal && <span className="font-normal text-ink-2"> · {b.pax} orang</span>}
          </p>
          <p className="mt-0.5 text-sm break-words text-ink-2">
            {b.purpose}
            {b.organization && !b.isInternal && <span className="text-ink-3"> · {b.organization}</span>}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
            <p className="text-xs text-ink-3 tabular-nums">{meta}</p>
            <div className="ml-auto flex gap-2">
              {b.status === "PENDING" ? (
                <>
                  <Button variant="danger" size="sm" onClick={onReject}>
                    Tolak
                  </Button>
                  <Button variant="primary" size="sm" icon="check" onClick={onConfirm}>
                    Konfirmasi
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={onDetail}>
                  Detail
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
