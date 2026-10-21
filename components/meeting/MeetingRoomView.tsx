"use client";

import { useMemo, useState } from "react";
import { ROOMS } from "@/lib/booking";
import { todayISO } from "@/lib/format";
import type { Booking, BookingStatus, RoomId } from "@/lib/types";
import { useBookings } from "../data-hooks";
import Icon from "../Icon";
import { useStore } from "../store";
import { Button, EmptyState, inputCls, SkeletonPage, StatCard, StatGrid } from "../ui";
import { ConfirmBookingDialog } from "./dialogs/ConfirmBookingDialog";
import { DetailDialog } from "./dialogs/DetailDialog";
import { ManualBookingDialog } from "./dialogs/ManualBookingDialog";
import { ReasonDialog } from "./dialogs/ReasonDialog";
import BookingRow from "./BookingRow";
import DayCalendar from "./DayCalendar";

type Filter = "all" | "pending" | "confirmed" | "done" | "rejected";

const GROUPS: Record<Exclude<Filter, "all">, BookingStatus[]> = {
  pending: ["PENDING"],
  confirmed: ["CONFIRMED"],
  done: ["COMPLETED", "NO_SHOW"],
  rejected: ["REJECTED", "CANCELLED"],
};

const FILTER_TITLE: Record<Filter, string> = {
  pending: "Menunggu konfirmasi",
  confirmed: "Dikonfirmasi",
  done: "Selesai",
  rejected: "Ditolak / dibatalkan",
  all: "Semua booking",
};

// Warna dropdown status mengikuti status yang dipilih, supaya filter aktif terlihat jelas.
const FILTER_TONE: Record<Filter, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-800",
  done: "border-slate-300 bg-slate-100 text-slate-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  all: "border-navy/40 bg-navy/5 text-navy",
};

const matches = (b: Booking, f: Filter) => f === "all" || (!b.isInternal && GROUPS[f].includes(b.status));

type Modal =
  | { kind: "confirm"; id: string }
  | { kind: "reject"; id: string }
  | { kind: "cancel"; id: string }
  | { kind: "detail"; id: string }
  | { kind: "booking"; roomId?: RoomId }
  | null;

export default function MeetingRoomView() {
  const { ready, content } = useStore();
  const { bookings, confirm, reject, cancel, mark, createManual } = useBookings();
  const today = todayISO();
  const outlet = content["ub-coffee"].outlets[0];

  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  // Default "Menunggu": hal pertama yang perlu ditangani admin saat membuka halaman.
  const [filter, setFilter] = useState<Filter>("pending");
  const [calDate, setCalDate] = useState(today);
  const [modal, setModal] = useState<Modal>(null);

  const stats = useMemo(() => {
    const real = bookings.filter((b) => !b.isInternal);
    return {
      pending: real.filter((b) => b.status === "PENDING").length,
      confirmed: real.filter((b) => b.status === "CONFIRMED" && b.date >= today).length,
      today: real.filter((b) => b.date === today && (b.status === "PENDING" || b.status === "CONFIRMED")).length,
    };
  }, [bookings, today]);

  const searched = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        (!date || b.date === date) &&
        (!term || [b.name, b.organization, b.code].some((v) => v.toLowerCase().includes(term))),
    );
  }, [bookings, q, date]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      pending: searched.filter((b) => matches(b, "pending")).length,
      confirmed: searched.filter((b) => matches(b, "confirmed")).length,
      done: searched.filter((b) => matches(b, "done")).length,
      rejected: searched.filter((b) => matches(b, "rejected")).length,
    }),
    [searched],
  );

  // Yang akan datang lebih dulu (paling dekat di atas), lalu yang sudah lewat (terbaru di atas).
  const list = useMemo(() => {
    const key = (b: Booking) => `${b.date} ${b.start}`;
    const rows = searched.filter((b) => matches(b, filter));
    const upcoming = rows.filter((b) => b.date >= today).sort((a, b) => key(a).localeCompare(key(b)));
    const past = rows.filter((b) => b.date < today).sort((a, b) => key(b).localeCompare(key(a)));
    return [...upcoming, ...past];
  }, [searched, filter, today]);

  const find = (id: string) => bookings.find((b) => b.id === id) ?? null;

  if (!ready) return <SkeletonPage />;

  const current = modal && modal.kind !== "booking" ? find(modal.id) : null;
  const hasFilter = q || date || filter !== "pending";
  const noPending = filter === "pending" && !q && !date;

  return (
    <>
      <StatGrid>
        <StatCard icon="clock" tone="yellow" value={stats.pending} label="Menunggu konfirmasi" />
        <StatCard icon="checkCircle" tone="green" value={stats.confirmed} label="Dikonfirmasi" />
        <StatCard icon="today" tone="blue" value={stats.today} label="Booking hari ini" />
        <StatCard icon="store" tone="slate" value={ROOMS.length} label="Tempat booking" />
      </StatGrid>

      {/* Jadwal semua ruang, di atas daftar booking */}
      <DayCalendar
        date={calDate}
        onDateChange={setCalDate}
        bookings={bookings}
        outlet={outlet}
        onOpen={(b) => setModal({ kind: "detail", id: b.id })}
        onNewBooking={(roomId) => setModal({ kind: "booking", roomId })}
      />

      {/* Filter: status (paling kiri) · cari · tanggal */}
      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-3">
        <div className="min-w-0 flex-[1_1_240px] sm:max-w-[260px]">
          <label htmlFor="mr-status" className="sr-only">
            Filter status
          </label>
          <select
            id="mr-status"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className={`min-h-11 w-full cursor-pointer rounded-xl border-[1.5px] px-3.5 text-[15px] font-bold outline-none transition-colors focus:ring-2 focus:ring-navy/15 ${FILTER_TONE[filter]}`}
          >
            <option value="pending" className="bg-white text-ink">Menunggu konfirmasi ({counts.pending})</option>
            <option value="confirmed" className="bg-white text-ink">Dikonfirmasi ({counts.confirmed})</option>
            <option value="done" className="bg-white text-ink">Selesai ({counts.done})</option>
            <option value="rejected" className="bg-white text-ink">Ditolak / dibatalkan ({counts.rejected})</option>
            <option value="all" className="bg-white text-ink">Semua status ({counts.all})</option>
          </select>
        </div>
        <div className="relative min-w-0 flex-[1_1_320px]">
          <label htmlFor="mr-search" className="sr-only">
            Cari booking
          </label>
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
          <input
            id="mr-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama pemesan, instansi, atau kode"
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="relative min-w-0 flex-[1_1_180px] sm:max-w-[200px]">
          <label htmlFor="mr-date" className="sr-only">
            Filter tanggal
          </label>
          <input
            id="mr-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value) setCalDate(e.target.value);
            }}
            className={`${inputCls} min-w-0 ${date ? "pr-10" : ""}`}
          />
          {date && (
            <button
              type="button"
              onClick={() => setDate("")}
              aria-label="Hapus filter tanggal"
              title="Hapus filter tanggal"
              className="absolute top-1/2 right-9 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:bg-white hover:text-ink"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Daftar booking */}
      <div>
        <section aria-labelledby="list-title" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 pl-1">
            <div className="min-w-0">
              <h2 id="list-title" className="font-extrabold text-navy">
                {FILTER_TITLE[filter]}
              </h2>
              <p className="text-[13px] font-semibold text-ink-3 tabular-nums">{list.length} booking</p>
            </div>
            <Button variant="primary" icon="plus" onClick={() => setModal({ kind: "booking" })}>
              Booking Jadwal
            </Button>
          </div>
          {list.length === 0 ? (
            <EmptyState
              text={
                noPending
                  ? "Tidak ada booking yang menunggu konfirmasi."
                  : hasFilter
                    ? "Tidak ada booking yang cocok dengan filter."
                    : "Belum ada booking meeting room."
              }
              action={
                noPending ? (
                  <Button onClick={() => setFilter("all")}>Lihat semua booking</Button>
                ) : hasFilter ? (
                  <Button
                    onClick={() => {
                      setQ("");
                      setDate("");
                      setFilter("pending");
                    }}
                  >
                    Reset filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid gap-3">
              {list.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onConfirm={() => setModal({ kind: "confirm", id: b.id })}
                  onReject={() => setModal({ kind: "reject", id: b.id })}
                  onDetail={() => setModal({ kind: "detail", id: b.id })}
                />
              ))}
            </ul>
          )}
        </section>

      </div>

      {modal?.kind === "confirm" && (
        <ConfirmBookingDialog
          booking={current}
          onClose={() => setModal(null)}
          onSubmit={(note) => confirm(modal.id, note)}
        />
      )}
      {modal?.kind === "reject" && (
        <ReasonDialog
          mode="reject"
          booking={current}
          onClose={() => setModal(null)}
          onSubmit={(reason) => reject(modal.id, reason)}
        />
      )}
      {modal?.kind === "cancel" && (
        <ReasonDialog
          mode="cancel"
          booking={current}
          onClose={() => setModal(null)}
          onSubmit={(reason) => cancel(modal.id, reason)}
        />
      )}
      {modal?.kind === "detail" && (
        <DetailDialog
          booking={current}
          onClose={() => setModal(null)}
          onConfirm={() => setModal({ kind: "confirm", id: modal.id })}
          onReject={() => setModal({ kind: "reject", id: modal.id })}
          onCancel={() => setModal({ kind: "cancel", id: modal.id })}
          onMark={async (to) => {
            await mark(modal.id, to);
          }}
        />
      )}
      <ManualBookingDialog
        open={modal?.kind === "booking"}
        initialDate={calDate < today ? today : calDate}
        initialRoom={modal?.kind === "booking" ? (modal.roomId ?? ROOMS[0].id) : ROOMS[0].id}
        bookings={bookings}
        outlet={outlet}
        onClose={() => setModal(null)}
        onSubmit={async (v) => {
          const ok = await createManual(v);
          if (ok) setCalDate(v.date);
          return ok;
        }}
      />
    </>
  );
}
