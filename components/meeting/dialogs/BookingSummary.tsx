"use client";

import type { ReactNode } from "react";
import { roomOf, waKindFor, waLink } from "@/lib/booking";
import { formatDateLong, formatPhone, hhmm } from "@/lib/format";
import type { Booking } from "@/lib/types";
import Icon from "../../Icon";

/** Ringkasan data booking dan tombol WhatsApp, dipakai beberapa dialog booking. */
export function Summary({ b }: { b: Booking }) {
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
        [
          "Peserta",
          roomOf(b.roomId).capacity === undefined
            ? `${b.pax} orang`
            : `${b.pax} orang (kapasitas ${roomOf(b.roomId).capacity})`,
        ],
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

export function WaButton({ b, label = "Kirim WA ke pemesan" }: { b: Booking; label?: string }) {
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
