import { formatDateLong, hhmm, todayISO, nowHHMM, toMinutes, weekdayIndex } from "./format";
import type { Booking, BookingStatus, Outlet, RoomId } from "./types";

export type Room = { id: RoomId; name: string; kind: "Ruang meeting" | "Open space"; capacity: number };

/** 2 ruang meeting + 1 open space. Nama & kapasitas disesuaikan dengan kondisi UB Coffee. */
export const ROOMS: Room[] = [
  { id: "mr1", name: "Meeting Room 1", kind: "Ruang meeting", capacity: 15 },
  { id: "mr2", name: "Meeting Room 2", kind: "Ruang meeting", capacity: 15 },
  { id: "open", name: "Open Space", kind: "Open space", capacity: 30 },
];

export const roomOf = (id: RoomId): Room => ROOMS.find((r) => r.id === id) ?? ROOMS[0];

/** Jeda bersih-bersih antar booking di ruang yang sama (menit). */
export const BUFFER_MIN = 30;

/** Rentang jadwal ruang: 07.00 – 22.00. */
export const GRID_START = 7 * 60;
export const GRID_END = 22 * 60;

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  COMPLETED: "Selesai",
  NO_SHOW: "Tidak hadir",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export function statusTone(b: Booking): "warn" | "ok" | "mute" {
  if (b.isInternal) return "mute";
  if (b.status === "PENDING") return "warn";
  if (b.status === "CONFIRMED") return "ok";
  return "mute";
}

export function statusLabel(b: Booking): string {
  if (b.isInternal) return b.status === "CANCELLED" ? "Blokir dihapus" : "Blokir";
  return STATUS_LABEL[b.status];
}

/** State machine booking (§9.2). Transisi lain ditolak (di server juga). */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return TRANSITIONS[from].includes(to);
}

/** Booking yang menempati slot (tampil di kalender & ikut cek bentrok). */
export function occupiesSlot(b: Booking) {
  return b.status === "PENDING" || b.status === "CONFIRMED";
}

export function isPast(b: Booking): boolean {
  const today = todayISO();
  return b.date < today || (b.date === today && b.end <= nowHHMM());
}

/** Cari booking yang bentrok di ruang yang sama (termasuk jeda bersih-bersih). Di produksi dijamin exclusion constraint DB. */
export function findConflict(all: Booking[], roomId: RoomId, date: string, start: string, end: string, ignoreId?: string) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return all.find((b) => {
    if (b.id === ignoreId || b.roomId !== roomId || b.date !== date || !occupiesSlot(b)) return false;
    const bs = toMinutes(b.start) - BUFFER_MIN;
    const be = toMinutes(b.end) + BUFFER_MIN;
    return s < be && e > bs;
  });
}

/** Jam buka outlet untuk tanggal tertentu, dalam menit. Null jika libur. */
export function openRange(outlet: Outlet | undefined, date: string): { open: number; close: number } | null {
  const h = outlet?.hours[weekdayIndex(date)];
  if (!h || h.closed || !h.open || !h.close) return null;
  return { open: toMinutes(h.open), close: toMinutes(h.close) };
}

export function timeSlots(from = GRID_START, to = GRID_END): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
}

export function waLink(b: Booking, kind: "confirmed" | "rejected" | "cancelled" | "general"): string {
  const when = `${formatDateLong(b.date)}, pukul ${hhmm(b.start)}–${hhmm(b.end)}`;
  const head = `Halo ${b.name}, kami dari UB Coffee.`;
  const room = `${roomOf(b.roomId).name} UB Coffee`;
  const lines: Record<typeof kind, string> = {
    confirmed: `${head}\n\nBooking ${room} Anda (${b.code}) pada ${when} untuk ${b.pax} orang telah *DIKONFIRMASI*.${
      b.adminNote ? `\n\nCatatan: ${b.adminNote}` : ""
    }\n\nSampai jumpa di UB Coffee!`,
    rejected: `${head}\n\nMohon maaf, booking ${room} Anda (${b.code}) pada ${when} belum dapat kami terima.${
      b.adminNote ? `\n\nAlasan: ${b.adminNote}` : ""
    }\n\nSilakan pilih jadwal lain melalui website kami.`,
    cancelled: `${head}\n\nBooking ${room} Anda (${b.code}) pada ${when} telah dibatalkan.${
      b.adminNote ? `\n\nKeterangan: ${b.adminNote}` : ""
    }`,
    general: `${head}\n\nTerkait booking ${room} Anda (${b.code}) pada ${when}.`,
  };
  return `https://wa.me/${b.phone}?text=${encodeURIComponent(lines[kind])}`;
}

export function waKindFor(b: Booking): Parameters<typeof waLink>[1] {
  if (b.status === "CONFIRMED") return "confirmed";
  if (b.status === "REJECTED") return "rejected";
  if (b.status === "CANCELLED") return "cancelled";
  return "general";
}
