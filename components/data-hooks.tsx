"use client";

/**
 * Hook data per entitas: satu-satunya jalan komponen membaca dan mengubah data.
 * Memanggil lib/repo, memperbarui cache di store dengan hasilnya, dan menampilkan toast lewat run().
 */
import { canTransition } from "@/lib/booking";
import * as repo from "@/lib/repo";
import type { Booking, BookingStatus, ManualBookingInput } from "@/lib/types";
import { useStore } from "./store";

const STALE_MESSAGE = "Status booking sudah berubah. Muat ulang halaman.";

export function useBookings() {
  const { bookings, setBookings, run, toast, user } = useStore();
  const by = user.name;

  const replace = (b: Booking) => setBookings((all) => all.map((x) => (x.id === b.id ? b : x)));

  /** Transisi tidak sah ditolak seketika di klien; repo memeriksanya lagi. */
  function transition(id: string, to: BookingStatus, call: () => Promise<Booking>) {
    const b = bookings.find((x) => x.id === id);
    if (!b || !canTransition(b.status, to)) {
      toast(STALE_MESSAGE, "error");
      return Promise.resolve(false);
    }
    return run(async () => replace(await call()));
  }

  return {
    bookings,
    confirm: (id: string, note: string) => transition(id, "CONFIRMED", () => repo.confirmBooking(id, note, by)),
    reject: (id: string, reason: string) => transition(id, "REJECTED", () => repo.rejectBooking(id, reason, by)),
    cancel: (id: string, reason: string) => transition(id, "CANCELLED", () => repo.cancelBooking(id, reason, by)),
    mark: (id: string, to: "COMPLETED" | "NO_SHOW") => transition(id, to, () => repo.markBooking(id, to, by)),
    createManual: (input: ManualBookingInput) =>
      run(async () => {
        const b = await repo.createManualBooking(input, by);
        setBookings((all) => [...all, b]);
      }, `Booking ${input.name} disimpan dan dikonfirmasi.`),
  };
}
