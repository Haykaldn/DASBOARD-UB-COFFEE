"use client";

import { useEffect, useState } from "react";
import { GRID_END, GRID_START, occupiesSlot, openRange, ROOMS } from "@/lib/booking";
import { addDays, formatDateLong, hhmm, nowHHMM, todayISO, toMinutes } from "@/lib/format";
import type { Booking, Outlet, RoomId } from "@/lib/types";
import Icon from "../Icon";
import { cx, IconButton } from "../ui";

const SPAN = GRID_END - GRID_START;
const HOURS = Array.from({ length: SPAN / 60 + 1 }, (_, i) => GRID_START / 60 + i);
/** Posisi menit → persen lebar timeline. */
const pct = (min: number) => `${((Math.min(Math.max(min, GRID_START), GRID_END) - GRID_START) / SPAN) * 100}%`;

/**
 * Jadwal harian semua tempat dalam satu tampilan: satu baris per ruang, sumbu jam mendatar
 * (07.00 – 22.00). Klik area kosong di baris ruang untuk membuat booking di ruang itu.
 */
export default function DayCalendar({
  date,
  onDateChange,
  bookings,
  outlet,
  onOpen,
  onNewBooking,
}: {
  date: string;
  onDateChange: (d: string) => void;
  bookings: Booking[];
  outlet: Outlet | undefined;
  onOpen: (b: Booking) => void;
  onNewBooking: (roomId: RoomId) => void;
}) {
  const today = todayISO();
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(nowHHMM());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const day = bookings.filter((b) => b.date === date && occupiesSlot(b));
  const open = openRange(outlet, date);
  const nowMin = date === today && now ? toMinutes(now) : null;
  const showNow = nowMin !== null && nowMin >= GRID_START && nowMin <= GRID_END;

  return (
    <section aria-labelledby="cal-title" className="mb-6 rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="cal-title" className="font-extrabold text-navy">
            Jadwal ruang
          </h2>
          <p className="text-[13px] text-ink-3">
            {ROOMS.length} tempat. Klik area kosong pada baris ruang untuk membuat booking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-page p-1">
            <IconButton icon="chevronLeft" label="Hari sebelumnya" onClick={() => onDateChange(addDays(date, -1))} />
            <p className="min-w-[200px] px-2 text-center text-sm font-bold text-navy" aria-live="polite">
              {formatDateLong(date)}
            </p>
            <IconButton icon="chevronRight" label="Hari berikutnya" onClick={() => onDateChange(addDays(date, 1))} />
          </div>
          <button
            type="button"
            onClick={() => onDateChange(today)}
            disabled={date === today}
            className="min-h-10 rounded-xl border border-line px-3 text-[13px] font-bold text-navy hover:bg-page disabled:opacity-45"
          >
            Hari ini
          </button>
        </div>
      </div>

      {open === null && (
        <p className="mb-3 rounded-xl bg-page px-3 py-2 text-[13px] text-ink-2">UB Coffee libur pada tanggal ini.</p>
      )}

      {/* Lebar minimum agar label jam tetap terbaca; di layar sempit digeser ke samping. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="min-w-[860px]">
          {/* Label jam */}
          <div className="grid grid-cols-[170px_minmax(0,1fr)]" aria-hidden="true">
            <span />
            <div className="relative h-5">
              {HOURS.map((h, i) => (
                <span
                  key={h}
                  className={cx(
                    "absolute top-0 text-[11px] font-semibold text-ink-3 tabular-nums",
                    i === 0 ? "" : i === HOURS.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                  )}
                  style={{ left: pct(h * 60) }}
                >
                  {String(h).padStart(2, "0")}.00
                </span>
              ))}
            </div>
          </div>

          <ul className="overflow-hidden rounded-xl border border-line">
            {ROOMS.map((room, ri) => {
              const items = day.filter((b) => b.roomId === room.id);
              return (
                <li key={room.id} className={cx("grid grid-cols-[170px_minmax(0,1fr)]", ri > 0 && "border-t border-line")}>
                  <div className="flex flex-col justify-center border-r border-line bg-page px-3">
                    <p className="text-[13px] leading-tight font-extrabold text-navy">{room.name}</p>
                    <p className="text-[11px] leading-tight text-ink-3">
                      {room.kind} · {room.capacity} orang
                    </p>
                  </div>

                  <div className="relative h-12">
                    {/* Klik area kosong → booking baru di ruang ini */}
                    <button
                      type="button"
                      onClick={() => onNewBooking(room.id)}
                      aria-label={`Booking ${room.name} pada ${formatDateLong(date)}`}
                      className="absolute inset-0 hover:bg-blue-50/40"
                    />
                    {/* Di luar jam buka */}
                    {open === null ? (
                      <div className="pointer-events-none absolute inset-0 bg-slate-100" />
                    ) : (
                      <>
                        {open.open > GRID_START && (
                          <div className="pointer-events-none absolute inset-y-0 left-0 bg-slate-100" style={{ width: pct(open.open) }} />
                        )}
                        {open.close < GRID_END && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 bg-slate-100" style={{ left: pct(open.close) }} />
                        )}
                      </>
                    )}
                    {/* Garis jam */}
                    {HOURS.slice(1, -1).map((h) => (
                      <div key={h} className="pointer-events-none absolute inset-y-0 border-l border-line" style={{ left: pct(h * 60) }} />
                    ))}
                    {showNow && (
                      <div
                        className="pointer-events-none absolute inset-y-0 z-20 border-l-2 border-red-500"
                        style={{ left: pct(nowMin) }}
                        aria-hidden="true"
                      />
                    )}

                    {items.map((b) => {
                      const s = toMinutes(b.start);
                      const e = toMinutes(b.end);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onOpen(b)}
                          title={`${b.name} · ${hhmm(b.start)} – ${hhmm(b.end)}`}
                          aria-label={`${room.name}: ${b.name}, ${hhmm(b.start)} sampai ${hhmm(b.end)}. Buka detail`}
                          className={cx(
                            "absolute inset-y-1 z-10 flex flex-col justify-center overflow-hidden rounded-md border-l-4 px-2 text-left text-[11px] leading-tight hover:brightness-95",
                            b.isInternal
                              ? "border-slate-500 bg-mute-bg text-mute-fg"
                              : b.status === "PENDING"
                                ? "border-amber-500 bg-warn-bg text-warn-fg"
                                : "border-green-600 bg-ok-bg text-ok-fg",
                          )}
                          style={{ left: `calc(${pct(s)} + 2px)`, width: `calc(${pct(e)} - ${pct(s)} - 4px)` }}
                        >
                          <span className="block truncate font-bold">
                            {b.isInternal && <Icon name="ban" size={12} className="mr-1 inline align-[-1px]" />}
                            {b.name}
                          </span>
                          <span className="block truncate tabular-nums">
                            {hhmm(b.start)} – {hhmm(b.end)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-2" aria-label="Keterangan warna">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amber-400" /> Menunggu
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-green-600" /> Dikonfirmasi
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-slate-500" /> Blokir
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-slate-200" /> Tutup
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-red-500" /> Sekarang
        </li>
      </ul>
    </section>
  );
}
