"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import Icon from "./Icon";
import { cx } from "./ui";

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

type Point = { x: number; y: number };
type Pos = Point & { w: number; h: number };

const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** Jarak dari tepi layar (px) yang memicu auto-scroll saat menyeret. */
const EDGE = 72;
const LIFT_SHADOW = "0 18px 40px -12px rgb(15 23 42 / 0.45)";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Elemen pertama di atas `el` yang bisa di-scroll vertikal; jika tidak ada, halaman. */
function scrollParent(el: HTMLElement | null): HTMLElement {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return document.scrollingElement as HTMLElement;
}

/**
 * Grid yang bisa diurutkan dengan menyeret pegangan (mouse & sentuh, pointer events)
 * atau keyboard (fokus pegangan lalu panah kiri/kanan).
 *
 * Animasi: item yang diseret terangkat dan mengikuti pointer, slot asalnya jadi placeholder
 * bergaris; item lain bergeser halus ke posisi baru (FLIP); saat dilepas item meluncur ke
 * slotnya. Di dekat tepi layar halaman ikut ter-scroll. Urutan baru langsung tampil selama
 * proses simpan (optimistis) dan kembali dengan animasi bila gagal. Hormati prefers-reduced-motion.
 */
export default function SortableGrid<T>({
  items,
  getId,
  getLabel,
  onReorder,
  renderItem,
  className,
  after,
}: {
  items: T[];
  getId: (it: T) => string;
  getLabel: (it: T, index: number) => string;
  /** Boleh mengembalikan Promise (mis. `reorder()` dari data-hooks): urutan baru ditahan sampai selesai; `false` = gagal, dikembalikan. */
  onReorder: (next: T[]) => void | Promise<unknown>;
  renderItem: (it: T, index: number, handle: ReactNode) => ReactNode;
  className: string;
  after?: ReactNode;
}) {
  /** Urutan sementara: saat menyeret, atau menunggu simpan selesai. null = pakai `items`. */
  const [order, setOrder] = useState<T[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const gridRef = useRef<HTMLUListElement>(null);

  /** <li> (slot) dan pembungkus isi (yang bergerak) per id. */
  const slots = useRef(new Map<string, HTMLLIElement>());
  const wraps = useRef(new Map<string, HTMLDivElement>());
  /** Posisi tiap slot relatif ke grid: hasil render terakhir, dan snapshot visual tepat sebelum urutan berubah. */
  const lastPos = useRef(new Map<string, Pos>());
  /** true selama urutan baru belum dirender & diukur; cegah hit-test memakai posisi basi. */
  const layoutPending = useRef(false);
  const snapshot = useRef<Map<string, Pos> | null>(null);
  /** Titik pegang di dalam item + posisi pointer terakhir (koordinat viewport). */
  const grab = useRef<Point>({ x: 0, y: 0 });
  const pointer = useRef<Point>({ x: 0, y: 0 });
  const scrollRaf = useRef(0);
  /** Nomor simpan terakhir; hasil simpan lama tidak boleh menimpa urutan yang lebih baru. */
  const saveSeq = useRef(0);
  // Cermin state untuk listener window (tidak ikut render ulang).
  const live = useRef({ order, dragId, items });
  // Dideklarasikan sebelum efek FLIP agar efek itu membaca nilai terbaru.
  useLayoutEffect(() => {
    live.current = { order, dragId, items };
  });

  const list = order ?? items;
  const orderKey = list.map(getId).join("|");

  function relPos(el: HTMLElement): Pos {
    const g = gridRef.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height };
  }

  /** Simpan posisi visual saat ini (termasuk animasi yang sedang berjalan) sebelum urutan berubah. */
  function takeSnapshot() {
    if (!gridRef.current) return;
    const m = new Map<string, Pos>();
    slots.current.forEach((el, id) => m.set(id, relPos(el)));
    snapshot.current = m;
  }

  /** Letakkan item yang diseret tepat di bawah pointer, relatif terhadap slotnya sekarang. */
  function followPointer() {
    const id = live.current.dragId;
    const slot = id && slots.current.get(id);
    const wrap = id && wraps.current.get(id);
    if (!slot || !wrap) return;
    const r = slot.getBoundingClientRect();
    wrap.style.setProperty("translate", `${pointer.current.x - grab.current.x - r.left}px ${pointer.current.y - grab.current.y - r.top}px`);
  }

  // FLIP: setelah urutan berubah, geser tiap item dari posisi lama ke posisi barunya.
  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const first = snapshot.current ?? lastPos.current;
    snapshot.current = null;
    const animate = !reducedMotion();
    const dragging = live.current.dragId;
    const next = new Map<string, Pos>();
    slots.current.forEach((el, id) => {
      el.getAnimations().forEach((a) => a.cancel());
      const to = relPos(el);
      next.set(id, to);
      if (!animate || id === dragging) return;
      const from = first.get(id);
      if (!from) {
        // Item baru: muncul dengan sedikit membesar.
        if (first.size) el.animate([{ opacity: 0, scale: "0.85" }, { opacity: 1, scale: "1" }], { duration: 260, easing: EASE });
        return;
      }
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 280, easing: EASE });
    });
    lastPos.current = next;
    layoutPending.current = false;
    followPointer();
  }, [orderKey]);

  /** Terapkan urutan baru: tampil langsung, lalu simpan. Gagal = kembali ke urutan semula. */
  function commit(next: T[]) {
    const seq = ++saveSeq.current;
    setOrder(next);
    const done = (ok: boolean) => {
      if (seq !== saveSeq.current || live.current.dragId) return;
      takeSnapshot();
      setOrder(null);
      if (!ok) setAnnounce("Urutan gagal disimpan dan dikembalikan.");
    };
    const res = onReorder(next);
    if (res instanceof Promise) res.then((v) => done(v !== false), () => done(false));
    else done(true);
  }

  // Selama menyeret: ikuti pointer di seluruh jendela (lebih andal daripada pointer capture
  // karena node <li> berpindah posisi di DOM saat urutan berubah).
  useEffect(() => {
    if (!dragId) return;

    /** Cari item di bawah pointer (melewati item yang sedang diseret) dan pindahkan ke sana. */
    /**
     * Cari slot di bawah pointer dan pindahkan item yang diseret ke sana. Memakai posisi
     * akhir slot (hasil layout), bukan posisi visual: item yang sedang beranimasi masih
     * tampak di bawah pointer dan akan memicu tukar-balik (berkedip).
     */
    const hitTest = () => {
      const { order: cur, dragId: id } = live.current;
      const grid = gridRef.current;
      if (!cur || !id || !grid || layoutPending.current) return;
      const g = grid.getBoundingClientRect();
      const px = pointer.current.x - g.left;
      const py = pointer.current.y - g.top;
      let overId: string | null = null;
      lastPos.current.forEach((p, key) => {
        if (key !== id && px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) overId = key;
      });
      if (!overId) return;
      const from = cur.findIndex((x) => getId(x) === id);
      const to = cur.findIndex((x) => getId(x) === overId);
      if (from < 0 || to < 0) return;
      takeSnapshot();
      const next = move(cur, from, to);
      live.current.order = next;
      layoutPending.current = true;
      setOrder(next);
    };

    const stopScroll = () => {
      cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = 0;
    };

    /** Auto-scroll saat pointer dekat tepi atas/bawah layar; makin dekat makin cepat. */
    const autoScroll = () => {
      const y = pointer.current.y;
      const h = window.innerHeight;
      const speed = y < EDGE ? -(EDGE - Math.max(y, 0)) / 3 : y > h - EDGE ? (Math.min(y, h) - (h - EDGE)) / 3 : 0;
      stopScroll();
      if (!speed) return;
      const tick = () => {
        scrollParent(gridRef.current).scrollBy(0, speed);
        followPointer();
        hitTest();
        scrollRaf.current = requestAnimationFrame(tick);
      };
      scrollRaf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: globalThis.PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      followPointer();
      hitTest();
      autoScroll();
    };

    const onUp = () => {
      stopScroll();
      const { order: cur, dragId: id, items: base } = live.current;
      if (!id) return;
      const wrap = wraps.current.get(id);
      if (wrap) {
        // Meluncur dari posisi pointer ke slot barunya.
        const from = wrap.style.translate || "0px 0px";
        wrap.style.translate = "";
        if (!reducedMotion()) {
          wrap.animate(
            [
              { translate: from, scale: "1.04", rotate: "-1deg", zIndex: 20, boxShadow: LIFT_SHADOW },
              { translate: "0px 0px", scale: "1", rotate: "0deg", zIndex: 20, boxShadow: "0 0 0 0 rgb(15 23 42 / 0)" },
            ],
            { duration: 280, easing: EASE },
          );
        }
      }
      live.current.dragId = null;
      setDragId(null);
      if (cur && cur.some((x, i) => getId(x) !== getId(base[i]))) {
        const to = cur.findIndex((x) => getId(x) === id);
        setAnnounce(`${getLabel(cur[to], to)} dipindah ke urutan ${to + 1}`);
        commit(cur);
      } else {
        setOrder(null);
      }
    };

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Batal: kembalikan ke urutan semula.
      stopScroll();
      const id = live.current.dragId;
      const wrap = id && wraps.current.get(id);
      if (wrap) wrap.style.translate = "";
      takeSnapshot();
      live.current.dragId = null;
      setDragId(null);
      setOrder(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      stopScroll();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
    // Listener cukup dipasang ulang saat mulai/selesai menyeret; nilai terbaru dibaca dari `live`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId]);

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (e.button !== 0) return;
    e.preventDefault();
    const r = slots.current.get(id)!.getBoundingClientRect();
    grab.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    pointer.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType === "touch") navigator.vibrate?.(8);
    saveSeq.current++; // simpan yang masih berjalan tidak boleh mereset urutan saat menyeret
    setOrder(list);
    setDragId(id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : 0;
    if (!delta || dragId) return;
    e.preventDefault();
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    takeSnapshot();
    setAnnounce(`${getLabel(list[index], index)} dipindah ke urutan ${to + 1}`);
    commit(move(list, index, to));
    requestAnimationFrame(() => {
      gridRef.current?.querySelectorAll<HTMLButtonElement>("[data-sort-handle]")[to]?.focus();
    });
  }

  return (
    <>
      <ul ref={gridRef} className={cx(className, dragId && "select-none")}>
        {list.map((it, i) => {
          const id = getId(it);
          const dragging = dragId === id;
          const handle = (
            <button
              type="button"
              data-sort-handle
              aria-label={`Seret untuk mengubah urutan ${getLabel(it, i)} (atau gunakan tombol panah)`}
              title="Seret untuk mengubah urutan"
              onPointerDown={(e) => onPointerDown(e, id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cx(
                "grid size-10 cursor-grab touch-none place-items-center rounded-lg shadow-sm transition-colors active:cursor-grabbing",
                dragging ? "bg-navy text-white" : "bg-white/90 text-ink-2 hover:bg-white hover:text-ink",
              )}
            >
              <Icon name="grip" size={20} />
            </button>
          );
          return (
            <li
              key={id}
              data-sort-id={id}
              ref={(el) => {
                if (el) slots.current.set(id, el);
                else slots.current.delete(id);
              }}
              className={cx(
                "relative min-w-0 rounded-xl outline-2 outline-dashed outline-transparent transition-[background-color,outline-color] duration-200",
                dragging && "bg-navy/5 outline-navy/35",
              )}
            >
              <div
                ref={(el) => {
                  if (el) wraps.current.set(id, el);
                  else wraps.current.delete(id);
                }}
                className={cx(
                  "relative rounded-xl transition-[scale,rotate,box-shadow,opacity] duration-200 ease-out",
                  dragging && "z-20 scale-[1.04] -rotate-1 cursor-grabbing shadow-[0_18px_40px_-12px_rgb(15_23_42/0.45)] will-change-[translate]",
                  dragId && !dragging && "opacity-85",
                )}
              >
                {renderItem(it, i, handle)}
              </div>
            </li>
          );
        })}
        {after}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </>
  );
}
