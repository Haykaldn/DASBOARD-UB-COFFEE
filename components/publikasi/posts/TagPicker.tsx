"use client";

import { useState } from "react";
import { slugify } from "@/lib/format";
import { POST_TAGS_MAX, POST_TYPE_LABEL, TAG_LABEL_MAX } from "@/lib/posts";
import type { PostTag, PostType } from "@/lib/types";
import Icon from "../../Icon";
import { Button, Field, inputCls } from "../../ui";

const NEW_TAG = "__new";

/** Pilih 1–3 tag dari jenis post ini. Tag baru bisa ditambah dari dropdown dan langsung tersimpan. */
export function TagPicker({
  type,
  options,
  allTags,
  selected,
  error,
  onAdd,
  onRemove,
  createTag,
}: {
  type: PostType;
  /** Tag milik jenis `type`. */
  options: PostTag[];
  /** Semua tag situs, untuk cek slug kembar. */
  allTags: PostTag[];
  selected: string[];
  error?: string;
  onAdd: (tag: PostTag) => void;
  onRemove: (id: string) => void;
  createTag: (label: string, type: PostType) => Promise<PostTag | null>;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = selected.length >= POST_TAGS_MAX;
  const chosen = selected.flatMap((id) => options.find((t) => t.id === id) ?? []);
  const available = options.filter((t) => !selected.includes(t.id));

  const cancel = () => {
    setAdding(false);
    setLabel("");
    setAddError(null);
  };

  async function add() {
    const l = label.trim();
    const slug = slugify(l);
    if (l.length < 2) return setAddError("Label minimal 2 karakter.");
    if (!slug) return setAddError("Gunakan huruf atau angka.");
    // Pesan cepat; repo memeriksa lagi saat menyimpan.
    if (options.some((t) => t.label.toLowerCase() === l.toLowerCase()) || allTags.some((t) => t.slug === slug))
      return setAddError("Tag ini sudah ada.");
    setBusy(true);
    const tag = await createTag(l, type);
    setBusy(false);
    if (!tag) return;
    onAdd(tag);
    cancel();
  }

  return (
    <Field
      label="Tag"
      error={error}
      hint={`${selected.length}/${POST_TAGS_MAX} tag.${full ? " Maksimal 3 tag." : ""}`}
      showOn="Label kartu, halaman detail, dan filter tag di website"
    >
      {(id, d) => (
        <div className="grid gap-2">
          {chosen.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Tag terpilih">
              {chosen.map((t) => (
                <li key={t.id} className="inline-flex items-center gap-1 rounded-lg bg-navy/10 py-1 pr-1 pl-2.5 text-[13px] font-bold text-navy">
                  {t.label}
                  <button
                    type="button"
                    aria-label={`Hapus tag ${t.label}`}
                    onClick={() => onRemove(t.id)}
                    className="grid size-5 place-items-center rounded-md hover:bg-navy/15"
                  >
                    <Icon name="close" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <select
            id={id}
            aria-describedby={d}
            aria-invalid={!!error}
            value=""
            disabled={full || adding}
            onChange={(e) => {
              const val = e.target.value;
              if (val === NEW_TAG) return setAdding(true);
              const tag = options.find((t) => t.id === val);
              if (tag) onAdd(tag);
            }}
            className={inputCls}
          >
            <option value="">{full ? "Maksimal 3 tag" : "Pilih tag…"}</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
            <option value={NEW_TAG}>+ Tambah tag baru…</option>
          </select>
          {adding && (
            <div className="grid gap-2 rounded-xl border border-line bg-page p-3">
              <label htmlFor={`${id}-new`} className="text-[13px] font-bold text-navy">
                Tag baru untuk {POST_TYPE_LABEL[type]}
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id={`${id}-new`}
                  maxLength={TAG_LABEL_MAX}
                  value={label}
                  aria-invalid={!!addError}
                  aria-describedby={addError ? `${id}-new-err` : undefined}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setAddError(null);
                  }}
                  onKeyDown={(e) => {
                    // Enter di sini menambah tag, bukan mengirim form post.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void add();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancel();
                    }
                  }}
                  placeholder="Contoh: Workshop"
                  className={`${inputCls} min-w-0 flex-[1_1_180px]`}
                />
                <Button size="sm" variant="primary" onClick={() => void add()} disabled={busy}>
                  Tambah
                </Button>
                <Button size="sm" onClick={cancel} disabled={busy}>
                  Batal
                </Button>
              </div>
              {addError && (
                <p id={`${id}-new-err`} className="text-[13px] font-medium text-danger">
                  {addError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
