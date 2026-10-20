/**
 * Booking meeting room. Nanti: server action + Prisma (MeetingBooking), dengan `by` diambil
 * dari session, bukan dari argumen.
 */
import { canTransition } from "../booking";
import { bookingCode, uid } from "../format";
import type { Booking, BookingStatus, ManualBookingInput } from "../types";
import { clone, delay, LOAD_DELAY_MS, mockDb, SAVE_DELAY_MS } from "./mock-db";

export async function listBookings(): Promise<Booking[]> {
  await delay(LOAD_DELAY_MS);
  return clone(mockDb().bookings);
}

/** Ubah status lewat state machine (lib/booking.ts) dan catat di riwayat. Transisi tidak sah ditolak. */
async function transition(
  id: string,
  to: BookingStatus,
  label: (b: Booking) => string,
  by: string,
  note = "",
): Promise<Booking> {
  await delay(SAVE_DELAY_MS);
  const db = mockDb();
  const b = db.bookings.find((x) => x.id === id);
  if (!b || !canTransition(b.status, to)) throw new Error("BOOKING_STALE");
  const next: Booking = {
    ...b,
    status: to,
    adminNote: note || b.adminNote,
    history: [...b.history, { at: new Date().toISOString(), label: label(b), by, note: note || undefined }],
  };
  db.bookings = db.bookings.map((x) => (x.id === id ? next : x));
  return clone(next);
}

export function confirmBooking(id: string, note: string, by: string) {
  return transition(id, "CONFIRMED", () => "Dikonfirmasi", by, note);
}

export function rejectBooking(id: string, reason: string, by: string) {
  return transition(id, "REJECTED", () => "Ditolak", by, reason);
}

export function cancelBooking(id: string, reason: string, by: string) {
  return transition(id, "CANCELLED", (b) => (b.isInternal ? "Blokir dihapus" : "Dibatalkan"), by, reason);
}

export function markBooking(id: string, to: "COMPLETED" | "NO_SHOW", by: string) {
  return transition(id, to, () => (to === "COMPLETED" ? "Ditandai selesai" : "Ditandai tidak hadir"), by);
}

/** Reservasi langsung yang diinput admin: langsung berstatus Dikonfirmasi. */
export async function createManualBooking(input: ManualBookingInput, by: string): Promise<Booking> {
  await delay(SAVE_DELAY_MS);
  const db = mockDb();
  const booking: Booking = {
    id: uid("bk"),
    code: bookingCode(input.date),
    ...input,
    email: "",
    isInternal: false,
    source: "ADMIN",
    status: "CONFIRMED",
    adminNote: "",
    createdAt: new Date().toISOString(),
    history: [{ at: new Date().toISOString(), label: "Booking diinput admin (langsung dikonfirmasi)", by }],
  };
  db.bookings = [...db.bookings, booking];
  return clone(booking);
}
