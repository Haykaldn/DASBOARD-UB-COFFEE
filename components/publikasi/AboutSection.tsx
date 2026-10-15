"use client";

import { useState } from "react";
import type { SiteConfig, SiteSettings } from "@/lib/types";
import { useDirtyGuard, useStore } from "../store";
import { Button, Field, inputCls, SectionCard } from "../ui";

const ABOUT_MAX = 500;

/** Link menu PDF diatur di section Menu (MenuPdfForm), bukan di sini. */
type AboutForm = Pick<SiteSettings, "about" | "instagram">;

function validate(v: AboutForm) {
  const e: Partial<Record<keyof AboutForm, string>> = {};
  if (v.about.trim().length < 3) e.about = "Tentang kami minimal 3 karakter.";
  if (v.about.length > ABOUT_MAX) e.about = `Maksimal ${ABOUT_MAX} karakter.`;
  if (v.instagram && !/^@[A-Za-z0-9._]{1,30}$/.test(v.instagram))
    e.instagram = "Format @username (huruf, angka, titik, garis bawah).";
  return e;
}

export default function AboutSection({ site }: { site: SiteConfig }) {
  const { content, setSite, save } = useStore();
  const saved = content[site.slug].settings;
  const [form, setForm] = useState<AboutForm>({ about: saved.about, instagram: saved.instagram });
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [busy, setBusy] = useState(false);

  const dirty = form.about !== saved.about || form.instagram !== saved.instagram;
  useDirtyGuard(`about-${site.slug}`, dirty);

  const set = <K extends keyof AboutForm>(k: K, v: AboutForm[K]) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (errors[k]) setErrors(validate(next));
  };

  return (
    <SectionCard
      id="tentang"
      title="Tentang & Kontak"
      description={
        site.slug === "ub-coffee"
          ? "Tagline di section Tentang dan Instagram di Kontak. Alamat, jam buka, dan WhatsApp di footer diambil dari section Lokasi & Jam Buka."
          : "Teks singkat tentang tempat dan tautan kontak."
      }
    >
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const v = { about: form.about.trim(), instagram: form.instagram.trim() };
          const errs = validate(v);
          setErrors(errs);
          if (Object.keys(errs).length) return;
          setBusy(true);
          const ok = await save(() => setSite(site.slug, (c) => ({ ...c, settings: { ...c.settings, ...v } })));
          setBusy(false);
          if (ok) setForm(v);
        }}
        className="grid gap-5"
      >
        <Field
          label="Tentang kami"
          error={errors.about}
          showOn={site.aboutTarget}
          hint={`${form.about.length}/${ABOUT_MAX} karakter`}
        >
          {(id, d) => (
            <textarea
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.about}
              rows={4}
              maxLength={ABOUT_MAX}
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              className={`${inputCls} py-2.5`}
            />
          )}
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Instagram" error={errors.instagram} showOn={site.instagramTarget}>
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.instagram}
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="@username"
                autoComplete="off"
                className={inputCls}
              />
            )}
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {dirty && <p className="text-[13px] text-warn-fg">Ada perubahan yang belum disimpan.</p>}
          {dirty && (
            <Button
              onClick={() => {
                setForm({ about: saved.about, instagram: saved.instagram });
                setErrors({});
              }}
            >
              Batalkan perubahan
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={busy || !dirty}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
