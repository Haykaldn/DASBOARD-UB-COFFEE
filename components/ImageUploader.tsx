"use client";

import { useRef, useState, type ReactNode } from "react";
import { uid } from "@/lib/format";
import type { Photo } from "@/lib/types";
import Icon from "./Icon";

const MAX_BYTES = 500 * 1024;

/** Aturan upload yang ditampilkan di semua petunjuk field foto. */
export const UPLOAD_RULE = "Format WebP, maks. 500 KB.";

/**
 * Cek tipe dari magic bytes (bukan ekstensi / Content-Type), §11.
 * Hanya WebP yang diterima; pemeriksaan yang sama wajib diulang di server (lib/image.ts).
 */
async function isWebp(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

/** 523264 → "511 KB" */
const kb = (bytes: number) => `${Math.ceil(bytes / 1024).toLocaleString("id-ID")} KB`;

type Upload = { name: string; progress: number };

/**
 * Hook upload foto: validasi ukuran & tipe, progress bar, pratinjau langsung.
 * `trigger()` membuka pemilih file; `status` ditaruh di bawah tombol/grid.
 */
export function useImageUpload(onUploaded: (photos: Photo[]) => void, opts: { multiple?: boolean } = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files);
    const errors: string[] = [];
    const ok: File[] = [];
    for (const f of list) {
      if (!(await isWebp(f))) errors.push(`${f.name}: hanya format WebP yang diterima.`);
      else if (f.size > MAX_BYTES) errors.push(`${f.name}: ukuran ${kb(f.size)}, maksimal 500 KB.`);
      else ok.push(f);
    }
    if (errors.length) setError(errors.join(" "));
    if (ok.length === 0) return;

    setUploads(ok.map((f) => ({ name: f.name, progress: 0 })));
    // Simulasi upload ke storage. Produksi: unggah ke server action → sharp → R2/Blob.
    for (let p = 20; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 120));
      setUploads((u) => u.map((x) => ({ ...x, progress: p })));
    }
    const photos: Photo[] = ok.map((f) => ({
      id: uid("ph"),
      src: URL.createObjectURL(f),
      hue: 0,
      alt: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
    }));
    setUploads([]);
    onUploaded(photos);
  }

  const busy = uploads.length > 0;

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/webp,.webp"
      multiple={opts.multiple}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        void handle(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const status: ReactNode = (
    <>
      {input}
      {busy && (
        <div className="mt-3 space-y-2" aria-live="polite">
          {uploads.map((u) => (
            <div key={u.name} className="rounded-xl border border-line px-3 py-2">
              <div className="mb-1.5 flex justify-between gap-3 text-[13px]">
                <span className="truncate text-ink-2">{u.name}</span>
                <span className="shrink-0 tabular-nums text-ink-3">{u.progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`Mengunggah ${u.name}`}
                aria-valuenow={u.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 overflow-hidden rounded-full bg-page"
              >
                <div className="h-full rounded-full bg-sidebar-active transition-[width]" style={{ width: `${u.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-danger-bg px-3 py-2 text-[13px] font-medium text-danger">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </>
  );

  return { trigger: () => inputRef.current?.click(), status, busy };
}

/** Field foto tunggal di dalam dialog (menu, poster, galeri). */
export function PhotoField({
  label,
  photo,
  onChange,
  aspect = "aspect-[4/3]",
  hint,
}: {
  label: string;
  photo: Photo | null;
  onChange: (p: Photo | null) => void;
  aspect?: string;
  hint?: string;
}) {
  const up = useImageUpload((p) => onChange(p[0]));
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className={`${aspect} w-40 overflow-hidden rounded-xl border border-line bg-page`}>
          {photo?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.src} alt={photo.alt} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-ink-3">
              <Icon name="image" size={26} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={up.trigger}
            disabled={up.busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-[13px] font-semibold hover:bg-page disabled:opacity-55"
          >
            <Icon name="upload" size={16} />
            {photo ? "Ganti foto" : "Pilih foto"}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-[13px] font-semibold text-danger hover:bg-danger-bg"
            >
              Hapus foto
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[13px] text-ink-3">{hint ?? UPLOAD_RULE}</p>
      {up.status}
    </div>
  );
}
