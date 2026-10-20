"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatDateMedium, slugify, todayISO, uid } from "@/lib/format";
import { POST_TYPE_LABEL, postState } from "@/lib/posts";
import type { Post, PostSeo, PostType, PublishStatus, SiteConfig } from "@/lib/types";
import { usePosts } from "../data-hooks";
import { ConfirmDialog } from "../Dialog";
import Icon, { type IconName } from "../Icon";
import { PhotoField, UPLOAD_RULE } from "../ImageUploader";
import PhotoView from "../PhotoView";
import { useDirtyGuard, useStore } from "../store";
import { Button, cx, EmptyState, Field, inputCls, SectionCard, StatusChip } from "../ui";
import MarkdownEditor from "./MarkdownEditor";

/** Pilihan tag untuk tipe post di situs ini; kosong = tipe tersebut tidak memakai tag. */
function tagsFor(site: SiteConfig, type: PostType) {
  return site.postTags?.[type] ?? [];
}

/** Label kartu: tipe, ditambah tag bila ada (mis. "Berita · Event"). */
function postLabel(site: SiteConfig, p: Post) {
  const tag = tagsFor(site, p.type).find((t) => t.value === p.tag);
  return tag ? `${POST_TYPE_LABEL[p.type]} · ${tag.label}` : POST_TYPE_LABEL[p.type];
}

const STATUS_OPTIONS: { value: PublishStatus; label: string; hint: string; icon: IconName }[] = [
  { value: "DRAFT", label: "Draft", hint: "Belum tampil publik", icon: "clock" },
  { value: "PUBLISHED", label: "Terbit", hint: "Siap dibaca publik", icon: "checkCircle" },
  { value: "ARCHIVED", label: "Arsip", hint: "Tidak ditampilkan", icon: "archive" },
];

export default function PostsSection({ site }: { site: SiteConfig }) {
  const data = usePosts(site.slug);
  const posts = [...data.posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  // Form tambah/edit tampil sebagai halaman penuh di dalam tab, menggantikan daftar.
  if (editing) {
    return (
      <PostEditor
        key={editing === "new" ? "new" : editing.id}
        site={site}
        post={editing === "new" ? null : editing}
        slugTaken={data.slugTaken}
        onClose={() => setEditing(null)}
        onSave={data.save}
        onDelete={data.remove}
      />
    );
  }

  return (
    <SectionCard
      id="event"
      title="Artikel & Berita"
      description={
        site.hasPostDetail
          ? "Berita dan artikel. Post terjadwal tayang otomatis pada tanggal terbit."
          : "Kartu “Kabar terbaru” di tab Event & Promo website, urut dari tanggal terbaru. Post terjadwal tayang otomatis pada tanggal terbit."
      }
      action={
        <Button icon="plus" onClick={() => setEditing("new")}>
          Tambah Publikasi
        </Button>
      }
    >
      {posts.length === 0 ? (
        <EmptyState
          text="Belum ada publikasi. Tambah artikel pertama."
          action={
            <Button icon="plus" onClick={() => setEditing("new")}>
              Tambah Publikasi
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {posts.map((p) => {
            const st = postState(p);
            return (
              <li key={p.id} className="flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-white">
                <div className="relative aspect-video bg-page">
                  <PhotoView photo={p.cover} label={`Belum ada poster ${p.title}`} />
                  <div className="absolute inset-x-2 top-2 flex flex-wrap justify-between gap-1.5">
                    <StatusChip tone="info" className="bg-white/95 text-ink">
                      {postLabel(site, p)}
                    </StatusChip>
                    <StatusChip tone={st.tone}>{st.label}</StatusChip>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-bold break-words">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink-2">
                    {p.startsAt && p.endsAt
                      ? `${formatDateMedium(p.startsAt)} – ${formatDateMedium(p.endsAt)}`
                      : `Terbit ${formatDateMedium(p.publishedAt)}`}
                  </p>
                  <div className="mt-auto flex justify-end pt-3">
                    <Button size="sm" icon="edit" onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`}>
                      Edit
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const TAGS_MAX = 10;
const EMPTY_SEO: PostSeo = { metaTitle: "", metaDescription: "", tags: [] };

function PostEditor({
  site,
  post,
  slugTaken,
  onClose,
  onSave,
  onDelete,
}: {
  site: SiteConfig;
  post: Post | null;
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
          type: site.postTypes[0],
          tag: tagsFor(site, site.postTypes[0])[0]?.value,
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
  const tags = tagsFor(site, v.type);
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
    if (tags.length && !tags.some((t) => t.value === v.tag)) e.tag = "Pilih tag.";
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
      tag: tags.length ? v.tag : undefined,
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
                      // Tag lama belum tentu ada di tipe baru: pakai tag pertama tipe tersebut.
                      setV({ ...v, type, tag: tagsFor(site, type)[0]?.value });
                    }}
                    className={inputCls}
                  >
                    {site.postTypes.map((t) => (
                      <option key={t} value={t}>
                        {POST_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              {tags.length > 0 && (
                <Field label="Tag" error={errors.tag} showOn="Label kecil di kartu dan halaman detail publikasi">
                  {(id, d) => (
                    <select
                      id={id}
                      aria-describedby={d}
                      aria-invalid={!!errors.tag}
                      value={v.tag ?? ""}
                      onChange={(e) => setV({ ...v, tag: e.target.value })}
                      className={inputCls}
                    >
                      {!tags.some((t) => t.value === v.tag) && <option value="">Pilih tag</option>}
                      {tags.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              )}
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

/** Pengaturan SEO: meta title, meta description, tags, dan pratinjau hasil pencarian Google. */
function SeoPanel({
  site,
  post,
  seo,
  setSeo,
  errors,
}: {
  site: SiteConfig;
  post: Post;
  seo: PostSeo;
  setSeo: (patch: Partial<PostSeo>) => void;
  errors: Record<string, string>;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const title = seo.metaTitle || post.title || "Judul publikasi";
  const desc = seo.metaDescription || post.excerpt || "Deskripsi singkat publikasi akan tampil di sini.";
  const host = site.url.replace(/^https?:\/\//, "");

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,+$/, "").toLowerCase();
    setTagDraft("");
    if (!t || seo.tags.includes(t) || seo.tags.length >= TAGS_MAX) return;
    setSeo({ tags: [...seo.tags, t] });
  };

  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && seo.tags.length) {
      setSeo({ tags: seo.tags.slice(0, -1) });
    }
  };

  return (
    <section aria-labelledby="seo-title" className="grid gap-5 rounded-2xl border border-line p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-[220px]">
          <h3 id="seo-title" className="font-extrabold text-navy">
            SEO Meta & Tags
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Mengatur tampilan publikasi di hasil pencarian Google dan saat dibagikan ke media sosial. Kosongkan untuk memakai judul &amp; ringkasan.
          </p>
        </div>
        <Button
          size="sm"
          icon="check"
          disabled={!post.title && !post.excerpt}
          onClick={() =>
            setSeo({
              metaTitle: seo.metaTitle || post.title.slice(0, META_TITLE_MAX),
              metaDescription: seo.metaDescription || post.excerpt.slice(0, META_DESC_MAX),
            })
          }
        >
          Isi dari konten
        </Button>
      </div>

      <Field
        label="Meta Title"
        optional
        error={errors.metaTitle}
        hint={<Counter n={seo.metaTitle.length} max={META_TITLE_MAX} text="Judul di tab browser & hasil pencarian." />}
      >
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!errors.metaTitle}
            placeholder={post.title || "Judul untuk mesin pencari"}
            value={seo.metaTitle}
            onChange={(e) => setSeo({ metaTitle: e.target.value })}
            className={inputCls}
          />
        )}
      </Field>

      <Field
        label="Meta Description"
        optional
        error={errors.metaDescription}
        hint={<Counter n={seo.metaDescription.length} max={META_DESC_MAX} text="Muncul di Google SERP & social preview. Ideal 150–160 karakter." />}
      >
        {(id, d) => (
          <textarea
            id={id}
            aria-describedby={d}
            aria-invalid={!!errors.metaDescription}
            rows={3}
            placeholder="Deskripsi singkat 150–160 karakter untuk Google SERP & social preview"
            value={seo.metaDescription}
            onChange={(e) => setSeo({ metaDescription: e.target.value })}
            className={`${inputCls} py-2.5`}
          />
        )}
      </Field>

      <Field
        label="Tags"
        optional
        hint={`${seo.tags.length}/${TAGS_MAX} tag. Tekan Enter atau koma untuk menambah. 3–5 kata kunci topikal dipakai sebagai SEO keywords.`}
      >
        {(id, d) => (
          <div className={`${inputCls} flex h-auto min-h-11 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/15`}>
            {seo.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-navy/10 py-1 pr-1 pl-2.5 text-[13px] font-bold text-navy">
                {t}
                <button
                  type="button"
                  aria-label={`Hapus tag ${t}`}
                  onClick={() => setSeo({ tags: seo.tags.filter((x) => x !== t) })}
                  className="grid size-5 place-items-center rounded-md hover:bg-navy/15"
                >
                  <Icon name="close" size={13} />
                </button>
              </span>
            ))}
            <input
              id={id}
              aria-describedby={d}
              disabled={seo.tags.length >= TAGS_MAX}
              placeholder={seo.tags.length ? "" : "Ketik tag, tekan Enter"}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={() => addTag(tagDraft)}
              className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none"
            />
          </div>
        )}
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-bold text-navy">Pratinjau Google</p>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="truncate text-[13px] text-ink-2">
            {host} › news › {post.slug || "…"}
          </p>
          <p className="mt-0.5 truncate text-lg leading-snug text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{desc}</p>
        </div>
      </div>
    </section>
  );
}

function Counter({ n, max, text }: { n: number; max: number; text: string }) {
  return (
    <span className="flex flex-wrap justify-between gap-2">
      <span>{text}</span>
      <span className={n > max ? "font-bold text-danger" : "tabular-nums"}>
        {n}/{max}
      </span>
    </span>
  );
}
