"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { todayISO } from "@/lib/format";
import { getSiteContent, listBookings, resetMockDb } from "@/lib/repo";
import type { Booking, SessionUser, SiteContent, SiteSlug } from "@/lib/types";
import Icon from "./Icon";
import { cx } from "./ui";

/**
 * State dashboard di sisi klien: cache data dari lib/repo, toast, dan peringatan perubahan
 * belum disimpan. Komponen membaca dan mengubah data lewat components/data-hooks.tsx.
 * `save()` masih dipakai section Publikasi sampai dipindah ke repo (langkah 2b-2).
 */

type Toast = { id: number; tone: "ok" | "error"; text: string };

type Store = {
  user: SessionUser;
  ready: boolean;
  bookings: Booking[];
  content: Record<SiteSlug, SiteContent>;
  /**
   * Jalankan pemanggilan repo (yang juga memperbarui cache), lalu tampilkan toast.
   * Mengembalikan false jika gagal (data form tidak hilang).
   */
  run: (task: () => Promise<unknown>, message?: string) => Promise<boolean>;
  /** Simulasi simpan ke server. Mengembalikan false jika gagal (data form tidak hilang). */
  save: (apply: () => void, message?: string) => Promise<boolean>;
  /** Hanya untuk components/data-hooks.tsx: perbarui cache dengan hasil repo. */
  setBookings: (fn: (b: Booking[]) => Booking[]) => void;
  setSite: (site: SiteSlug, fn: (c: SiteContent) => SiteContent) => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
  setDirty: (key: string, dirty: boolean) => void;
  /** true jika boleh pindah halaman (tidak ada perubahan belum disimpan, atau user setuju). */
  confirmLeave: () => boolean;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore harus di dalam DashboardProvider");
  return s;
}

export const SAVED_MESSAGE = "Perubahan disimpan. Website diperbarui.";
const FAILED_MESSAGE = "Gagal menyimpan. Periksa koneksi lalu coba lagi.";
const LEAVE_MESSAGE = "Ada perubahan yang belum disimpan. Tinggalkan halaman ini?";

const EMPTY_CONTENT: SiteContent = {
  hero: [],
  settings: { about: "", instagram: "", menuPdfUrl: "" },
  menu: [],
  posts: [],
  gallery: [],
  outlets: [],
  meetingRoom: null,
};

export function DashboardProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [today] = useState(todayISO);
  const [bookings, setBookingsState] = useState<Booking[]>([]);
  const [content, setContent] = useState<Record<SiteSlug, SiteContent>>({
    "ub-coffee": EMPTY_CONTENT,
    "brewi-jaya": EMPTY_CONTENT,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ready, setReady] = useState(false);
  const dirty = useRef(new Set<string>());
  const toastId = useRef(0);

  // Muat data pertama dari repo (selama itu skeleton tampil).
  useEffect(() => {
    let active = true;
    resetMockDb(today); // hanya selama mock; dihapus saat diganti Prisma
    void Promise.all([listBookings(), getSiteContent("ub-coffee"), getSiteContent("brewi-jaya")]).then(([b, ub, bj]) => {
      if (!active) return;
      setBookingsState(b);
      setContent({ "ub-coffee": ub, "brewi-jaya": bj });
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [today]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const run = useCallback(
    async (task: () => Promise<unknown>, message = SAVED_MESSAGE) => {
      // Cek koneksi di sini (bukan di repo): repo nanti berjalan di server.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast(FAILED_MESSAGE, "error");
        return false;
      }
      try {
        await task();
      } catch {
        toast(FAILED_MESSAGE, "error");
        return false;
      }
      toast(message);
      return true;
    },
    [toast],
  );

  const save = useCallback(
    async (apply: () => void, message = SAVED_MESSAGE) => {
      await new Promise((r) => setTimeout(r, 450));
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast(FAILED_MESSAGE, "error");
        return false;
      }
      apply();
      toast(message);
      return true;
    },
    [toast],
  );

  const setSite = useCallback((site: SiteSlug, fn: (c: SiteContent) => SiteContent) => {
    setContent((c) => ({ ...c, [site]: fn(c[site]) }));
  }, []);

  const setDirty = useCallback((key: string, d: boolean) => {
    if (d) dirty.current.add(key);
    else dirty.current.delete(key);
  }, []);

  const confirmLeave = useCallback(() => {
    if (dirty.current.size === 0) return true;
    const ok = window.confirm(LEAVE_MESSAGE);
    if (ok) dirty.current.clear();
    return ok;
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      ready,
      bookings,
      content,
      run,
      save,
      setBookings: setBookingsState,
      setSite,
      toast,
      setDirty,
      confirmLeave,
    }),
    [user, ready, bookings, content, run, save, setSite, toast, setDirty, confirmLeave],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cx(
              "pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
              t.tone === "ok" ? "bg-ink text-white" : "bg-danger text-white",
            )}
          >
            <Icon name={t.tone === "ok" ? "checkCircle" : "info"} size={18} className="mt-0.5 shrink-0" />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Tandai form "belum disimpan" agar ada peringatan saat meninggalkan halaman. */
export function useDirtyGuard(key: string, isDirty: boolean) {
  const { setDirty } = useStore();
  useEffect(() => {
    setDirty(key, isDirty);
    return () => setDirty(key, false);
  }, [key, isDirty, setDirty]);
}
