"use client";

import { useEffect, useRef, useState } from "react";
import { slugify, todayISO, uid } from "@/lib/format";
import { POST_TAGS_MAX, POST_TYPE_LABEL, POST_TYPES, tagsOfType } from "@/lib/posts";
import type { Post, PostSeo, PostTag, PostType, PublishStatus, SiteConfig } from "@/lib/types";
import { ConfirmDialog } from "../../Dialog";
import Icon, { type IconName } from "../../Icon";
import { PhotoField, UPLOAD_RULE } from "../../ImageUploader";
import { useDirtyGuard, useStore } from "../../store";
import { Button, cx, Field, inputCls } from "../../ui";
import MarkdownEditor from "../MarkdownEditor";
import { META_DESC_MAX, META_TITLE_MAX, SeoPanel } from "./SeoPanel";
import { TagPicker } from "./TagPicker";

const STATUS_OPTIONS: { value: PublishStatus; label: string; hint: string; icon: IconName }[] = [
  { value: "DRAFT", label: "Draft", hint: "Belum tampil publik", icon: "clock" },
  { value: "PUBLISHED", label: "Terbit", hint: "Siap dibaca publik", icon: "checkCircle" },
  { value: "ARCHIVED", label: "Arsip", hint: "Tidak ditampilkan", icon: "archive" },
];

const EMPTY_SEO: PostSeo = { metaTitle: "", metaDescription: "", tags: [] };

export function PostEditor({
  site,
  post,
  allTags,
  createTag,
  slugTaken,
  onClose,
  onSave,
  onDelete,
}: {
  site: SiteConfig;
  post: Post | null;
  allTags: PostTag[];
  createTag: (label: string, type: PostType) => Promise<PostTag | null>;
  slugTaken: (slug: string, id: string) => boolean;
  onClose: () => void;
  onSave: (v: Post) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const { confirmLeave } = useStore();
  const [initial] = useState<Post>(() =>
    post
      ? { ...post, seo: post.seo ?? EMPTY_SEO }
      : {
          id: uid("p"),
          type: POST_TYPES[0],
          tags: [],
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          cover: null,
          publishedAt: todayISO(),
          startsAt: "",
          endsAt: "",
          status: "DRAFT",
          seo: EMPTY_SEO,
        },
  );
  const [v, setV] = useState<Post>(initial);
  const seo = v.seo ?? EMPTY_SEO;
  const typeTags = tagsOfType(allTags, v.type);
  const setSeo = (patch: Partial<PostSeo>) => setV({ ...v, seo: { ...seo, ...patch } });
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  useDirtyGuard(`post-${site.slug}`, dirty);

  // Form menggantikan daftar: bawa layar ke awal form.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, []);

  /** Kembali ke daftar; perubahan yang belum disimpan memicu konfirmasi. */
  const back = () => {
    if (dirty && !confirmLeave()) return;
    onClose();
  };

  function validate() {
    const e: Record<string, string> = {};
    if (v.title.trim().length < 3) e.title = "Judul minimal 3 karakter.";
    if (!site.hasPostDetail) {
      if (v.excerpt.trim().length < 3) e.excerpt = "Isi teks singkat yang tampil di kartu.";
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) e.slug = "Hanya huruf kecil, angka, dan tanda hubung.";
    else if (slugTaken(v.slug, v.id)) e.slug = "Slug sudah dipakai post lain.";
    if (v.tags.length === 0) e.tags = "Pilih minimal 1 tag.";
    if (!v.publishedAt) e.publishedAt = "Isi tanggal terbit.";
    if (seo.metaTitle.length > META_TITLE_MAX) e.metaTitle = `Maksimal ${META_TITLE_MAX} karakter.`;
    if (seo.metaDescription.length > META_DESC_MAX) e.metaDescription = `Maksimal ${META_DESC_MAX} karakter.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) {
      top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    setBusy(true);
    // Tanpa halaman detail, slug tetap dibuat otomatis (dipakai sebagai id stabil di website).
    const slug = site.hasPostDetail ? v.slug : v.slug || slugify(v.title);
    const ok = await onSave({
      ...v,
      slug,
      title: v.title.trim(),
      excerpt: v.excerpt.trim(),
      // Periode tayang tidak lagi dipakai; bersihkan sisa data lama saat disimpan.
      startsAt: "",
      endsAt: "",
      seo: { metaTitle: seo.metaTitle.trim(), metaDescription: seo.metaDescription.trim(), tags: seo.tags },
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div ref={top} className="scroll-mt-6">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="rounded-[20px] border border-line bg-white shadow-[0_1px_3px_rgb(15_23_42/0.04)]"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={back}
            aria-label="Kembali ke daftar publikasi"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-2 hover:bg-page hover:text-navy"
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight text-navy">{post ? "Edit Publikasi" : "Tambah Publikasi"}</h2>
            <p className="mt-0.5 truncate text-[13px] text-ink-3">
              {post ? post.title : "Lengkapi judul, konten, gambar, jadwal terbit, dan pengaturan SEO."}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Kolom utama: konten */}
          <div className="grid min-w-0 content-start gap-5">
            <Field label="Judul" error={errors.title}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.title}
                  maxLength={120}
                  placeholder="Judul publikasi"
                  value={v.title}
                  onChange={(e) => setV({ ...v, title: e.target.value, slug: slugTouched ? v.slug : slugify(e.target.value) })}
                  className={inputCls}
                />
              )}
            </Field>
            {site.hasPostDetail && (
              <Field label="Slug" error={errors.slug} hint={`Alamat halaman detail: /news/${v.slug || "…"}`}>
                {(id, d) => (
                  <input
                    id={id}
                    aria-describedby={d}
                    aria-invalid={!!errors.slug}
                    maxLength={80}
                    value={v.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setV({ ...v, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
                    }}
                    className={inputCls}
                  />
                )}
              </Field>
            )}
            <Field
              label={site.hasPostDetail ? "Ringkasan" : "Teks"}
              optional={site.hasPostDetail}
              error={errors.excerpt}
              hint={site.hasPostDetail ? "Tampil di kartu daftar publikasi." : undefined}
              showOn={site.hasPostDetail ? undefined : "Kartu di tab Event & Promo, di bawah judul"}
            >
              {(id, d) => (
                <textarea
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.excerpt}
                  rows={site.hasPostDetail ? 2 : 3}
                  maxLength={240}
                  value={v.excerpt}
                  onChange={(e) => setV({ ...v, excerpt: e.target.value })}
                  className={`${inputCls} py-2.5`}
                />
              )}
            </Field>
            {site.hasPostDetail && (
              <Field label="Konten" optional hint="Tampil di halaman detail. Mendukung **tebal**, *miring*, daftar, dan tautan https.">
                {(id, d) => <MarkdownEditor id={id} describedBy={d} value={v.body} onChange={(body) => setV({ ...v, body })} />}
              </Field>
            )}
            <PhotoField
              label="Gambar Publikasi"
              photo={v.cover}
              aspect="aspect-video"
              onChange={(cover) => setV({ ...v, cover })}
              hint={`Rasio 16:9. ${UPLOAD_RULE} Juga dipakai sebagai gambar pratinjau saat dibagikan.`}
            />

            <SeoPanel site={site} post={v} seo={seo} setSeo={setSeo} errors={errors} />
          </div>

          {/* Kolom samping: pengaturan terbit */}
          <aside className="grid min-w-0 content-start gap-5 xl:sticky xl:top-6 xl:self-start">
            <div className="grid gap-5 rounded-2xl border border-line bg-page/60 p-4">
              <h3 className="text-[11px] font-extrabold tracking-[0.12em] text-ink-3 uppercase">Pengaturan Terbit</h3>
              <Field label="Tipe">
                {(id) => (
                  <select
                    id={id}
                    value={v.type}
                    onChange={(e) => {
                      const type = e.target.value as PostType;
                      // Tag terikat pada jenis: kosongkan, admin memilih ulang tag jenis baru.
                      setV({ ...v, type, tags: [] });
                    }}
                    className={inputCls}
                  >
                    {POST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {POST_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <TagPicker
                type={v.type}
                options={typeTags}
                allTags={allTags}
                selected={v.tags}
                error={errors.tags}
                // Update fungsional: tag baru tiba setelah simpan async, isi form bisa sudah berubah.
                onAdd={(tag) =>
                  setV((cur) =>
                    cur.type !== tag.type || cur.tags.includes(tag.id) || cur.tags.length >= POST_TAGS_MAX
                      ? cur
                      : { ...cur, tags: [...cur.tags, tag.id] },
                  )
                }
                onRemove={(id) => setV((cur) => ({ ...cur, tags: cur.tags.filter((x) => x !== id) }))}
                createTag={createTag}
              />
              <fieldset>
                <legend className="mb-2 text-[11px] font-extrabold tracking-[0.12em] text-ink-3 uppercase">Status</legend>
                <div className="grid gap-2.5">
                  {STATUS_OPTIONS.map((o) => {
                    const active = v.status === o.value;
                    return (
                      <label
                        key={o.value}
                        className={cx(
                          "flex cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 transition-[background-color,border-color,box-shadow] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy/30",
                          active
                            ? "border-navy/25 bg-navy/[0.06] shadow-[0_10px_20px_-14px_rgb(15_60_107/0.55)]"
                            : "border-line bg-white hover:border-navy/20 hover:bg-page",
                        )}
                      >
                        <input
                          type="radio"
                          name="post-status"
                          value={o.value}
                          checked={active}
                          onChange={() => setV({ ...v, status: o.value })}
                          className="sr-only"
                        />
                        <span
                          className={cx(
                            "grid size-11 shrink-0 place-items-center rounded-xl border transition-colors",
                            active ? "border-transparent bg-white text-navy shadow-sm" : "border-line bg-page text-ink-2",
                          )}
                        >
                          <Icon name={o.icon} size={20} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-bold text-ink">{o.label}</span>
                          <span className="block text-[13px] font-semibold text-ink-3">{o.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <Field label="Tanggal terbit" error={errors.publishedAt} hint="Jika di masa depan, post berstatus Terjadwal.">
                {(id, d) => (
                  <input
                    id={id}
                    type="date"
                    aria-describedby={d}
                    aria-invalid={!!errors.publishedAt}
                    value={v.publishedAt}
                    onChange={(e) => setV({ ...v, publishedAt: e.target.value })}
                    className={inputCls}
                  />
                )}
              </Field>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-[20px] border-t border-line bg-white px-4 py-4 md:px-6">
          {post && (
            <Button variant="danger" icon="trash" className="mr-auto" onClick={() => setConfirmDel(true)}>
              Hapus
            </Button>
          )}
          {dirty && <p className="text-[13px] text-warn-fg">Ada perubahan yang belum disimpan.</p>}
          <Button onClick={back}>Batal</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan Publikasi"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDel}
        busy={busy}
        title="Hapus publikasi"
        message={`Hapus ${post?.title}? Tindakan ini tidak bisa dibatalkan.`}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          if (!post) return;
          setBusy(true);
          const ok = await onDelete(post.id);
          setBusy(false);
          if (ok) onClose();
        }}
      />
    </div>
  );
}
