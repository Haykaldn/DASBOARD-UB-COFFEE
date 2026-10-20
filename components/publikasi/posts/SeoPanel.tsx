"use client";

import { useState, type KeyboardEvent } from "react";
import type { Post, PostSeo, SiteConfig } from "@/lib/types";
import Icon from "../../Icon";
import { Button, Field, inputCls } from "../../ui";

export const META_TITLE_MAX = 60;
export const META_DESC_MAX = 160;
const TAGS_MAX = 10;

/** Pengaturan SEO: meta title, meta description, tags, dan pratinjau hasil pencarian Google. */
export function SeoPanel({
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
