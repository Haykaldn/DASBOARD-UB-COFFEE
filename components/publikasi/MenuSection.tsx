"use client";

import { useState, type ReactNode } from "react";
import { isHttpsUrl, rupiah, uid } from "@/lib/format";
import type { MenuCategory, MenuItem, SiteConfig } from "@/lib/types";
import { useMenu, useSettings } from "../data-hooks";
import { ConfirmDialog, FormDialog } from "../Dialog";
import Icon from "../Icon";
import { PhotoField, UPLOAD_RULE } from "../ImageUploader";
import PhotoView from "../PhotoView";
import SortableGrid from "../SortableGrid";
import { useDirtyGuard } from "../store";
import { Button, Checkbox, EmptyState, Field, inputCls, PillFilter, SectionCard, StatusChip } from "../ui";

const CATEGORIES: MenuCategory[] = ["Kopi", "Non-Kopi", "Makanan"];
type Cat = "all" | MenuCategory;

/** `editing`: null = tertutup, "new" = tambah, item = edit. Diangkat ke halaman agar tombol utama bisa membukanya. */
export default function MenuSection({
  site,
  editing,
  setEditing,
}: {
  site: SiteConfig;
  editing: MenuItem | "new" | null;
  setEditing: (v: MenuItem | "new" | null) => void;
}) {
  const menu = useMenu(site.slug);
  const items = menu.items;
  const [cat, setCat] = useState<Cat>("all");
  const shown = cat === "all" ? items : items.filter((m) => m.category === cat);
  const carousel = site.menuStyle === "CAROUSEL";
  // Urutan hanya bisa diubah saat semua kategori tampil (urutan carousel di website).
  const sortable = carousel && cat === "all";


  const card = (m: MenuItem, i: number, handle?: ReactNode) => (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="relative aspect-[4/3] bg-page">
        <PhotoView photo={m.photo} label={`Belum ada foto ${m.name}`} />
        <div className="absolute inset-x-2 top-2 flex flex-wrap justify-between gap-1.5">
          <span className="flex gap-1.5">
            {sortable && (
              <span className="grid h-6 min-w-6 place-items-center rounded-lg bg-ink/80 px-1.5 text-xs font-bold text-white tabular-nums">
                {i + 1}
              </span>
            )}
            <StatusChip tone="info" className="bg-white/95 text-ink">
              {m.category}
            </StatusChip>
          </span>
          <StatusChip tone={m.isAvailable ? "ok" : "warn"}>{m.isAvailable ? "Tersedia" : "Habis"}</StatusChip>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold break-words">
          {m.name}
          {!carousel && m.isFeatured && <span className="ml-1.5 align-middle text-xs font-semibold text-sidebar-active">· Unggulan</span>}
        </h3>
        {site.hasTasteTags && m.tags.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Tag rasa">
            {m.tags.map((t) => (
              <li key={t} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-2">
                {t}
              </li>
            ))}
          </ul>
        )}
        {carousel ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-2">{m.description || "Belum ada deskripsi."}</p>
        ) : (
          <p className="mt-1.5 font-semibold text-ink tabular-nums">{rupiah(m.price)}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <Checkbox
            label="Tersedia"
            checked={m.isAvailable}
            onChange={(v) => void menu.setAvailable(m, v)
            }
          />
          <span className="flex gap-2">
            {handle}
            <Button size="sm" icon="edit" onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}>
              Edit
            </Button>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <SectionCard
      id="menu"
      title="Menu"
      description={
        carousel
          ? `${items.length} item. Tab Menu website menampilkan menu yang tersedia satu per satu (carousel) sesuai urutan di sini, tanpa harga.`
          : `Menampilkan ${shown.length} dari ${items.length} item`
      }
      action={
        <Button icon="plus" onClick={() => setEditing("new")}>
          Tambah Menu
        </Button>
      }
    >
      {site.hasMenuPdf && <MenuPdfForm site={site} />}

      <div className="mb-4">
        <PillFilter<Cat>
          label="Filter kategori"
          value={cat}
          onChange={setCat}
          options={[
            { value: "all", label: "Semua", count: items.length },
            ...CATEGORIES.map((c) => ({ value: c, label: c, count: items.filter((m) => m.category === c).length })),
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          text={items.length === 0 ? "Belum ada menu. Tambah menu pertama." : "Belum ada menu di kategori ini."}
          action={
            <Button icon="plus" onClick={() => setEditing("new")}>
              Tambah Menu
            </Button>
          }
        />
      ) : sortable ? (
        <>
          <SortableGrid
            items={items}
            getId={(m) => m.id}
            getLabel={(m, i) => `menu ${i + 1} (${m.name})`}
            onReorder={menu.reorder}
            className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
            renderItem={card}
          />
          <p className="mt-3 text-[13px] text-ink-3">
            Seret pegangan <Icon name="grip" size={14} className="inline align-[-2px]" /> untuk mengubah urutan tampil di carousel.
          </p>
        </>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {shown.map((m, i) => (
            <li key={m.id} className="min-w-0">
              {card(m, i)}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <MenuDialog
          key={editing === "new" ? "new" : editing.id}
          site={site}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={menu.save}
          onDelete={menu.remove}
        />
      )}
    </SectionCard>
  );
}

/** Link "Lihat Menu Lengkap" di tab Menu website. Disimpan terpisah dari daftar menu. */
function MenuPdfForm({ site }: { site: SiteConfig }) {
  const { settings, update } = useSettings(site.slug);
  const saved = settings.menuPdfUrl;
  const [url, setUrl] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = url.trim() !== saved;
  useDirtyGuard(`menupdf-${site.slug}`, dirty);

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const v = url.trim();
        if (v && !isHttpsUrl(v)) return setError("Harus diawali https://");
        setError(null);
        setBusy(true);
        const ok = await update({ menuPdfUrl: v });
        setBusy(false);
        if (ok) setUrl(v);
      }}
      className="mb-5 grid gap-3 rounded-xl border border-line bg-page p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
    >
      <Field label="Link menu lengkap (PDF)" error={error} showOn="Tombol “Lihat Menu Lengkap” di tab Menu">
        {(id, d) => (
          <input
            id={id}
            type="url"
            inputMode="url"
            aria-describedby={d}
            aria-invalid={!!error}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className={inputCls}
          />
        )}
      </Field>
      <Button type="submit" variant="primary" disabled={busy || !dirty} className="sm:mt-[26px]">
        {busy ? "Menyimpan…" : "Simpan link"}
      </Button>
    </form>
  );
}

function MenuDialog({
  site,
  item,
  onClose,
  onSave,
  onDelete,
}: {
  site: SiteConfig;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (v: MenuItem) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [v, setV] = useState<MenuItem>(
    item ?? {
      id: uid("m"),
      name: "",
      category: "Kopi",
      price: 0,
      description: "",
      tags: [],
      photo: null,
      isAvailable: true,
      isFeatured: false,
    },
  );
  const [priceText, setPriceText] = useState(item ? String(item.price) : "");
  const [tagsText, setTagsText] = useState(item?.tags.join(", ") ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = "Nama minimal 2 karakter.";
    const price = Number(priceText.replace(/\D/g, ""));
    if (site.menuStyle === "CAROUSEL") {
      // Harga tidak tampil di website carousel; boleh kosong.
      if (price > 10_000_000) e.price = "Harga terlalu besar.";
    } else if (!priceText.trim() || !Number.isFinite(price) || price <= 0) e.price = "Isi harga dalam rupiah, contoh 22000.";
    else if (price > 10_000_000) e.price = "Harga terlalu besar.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <>
      <FormDialog
        open={!confirmDel}
        wide
        onClose={onClose}
        title={item ? `Edit menu` : "Tambah menu"}
        description={item?.name}
        onSubmit={async () => {
          if (!validate()) return;
          setBusy(true);
          const ok = await onSave({
            ...v,
            name: v.name.trim(),
            description: v.description.trim(),
            price: Number(priceText.replace(/\D/g, "")) || 0,
            tags: site.hasTasteTags
              ? tagsText
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 5)
              : [],
          });
          setBusy(false);
          if (ok) onClose();
        }}
        footer={
          <>
            {item && (
              <Button variant="danger" icon="trash" className="mr-auto" onClick={() => setConfirmDel(true)}>
                Hapus
              </Button>
            )}
            <Button onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <PhotoField label="Foto" photo={v.photo} onChange={(photo) => setV({ ...v, photo })} hint={`Rasio 4:3. ${UPLOAD_RULE}`} />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama" error={errors.name}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.name}
                  maxLength={80}
                  value={v.name}
                  onChange={(e) => setV({ ...v, name: e.target.value })}
                  className={inputCls}
                />
              )}
            </Field>
            <Field label="Kategori">
              {(id) => (
                <select
                  id={id}
                  value={v.category}
                  onChange={(e) => setV({ ...v, category: e.target.value as MenuCategory })}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="Harga (Rp)"
              optional={site.menuStyle === "CAROUSEL"}
              error={errors.price}
              hint={
                site.menuStyle === "CAROUSEL"
                  ? "Tidak tampil di website (harga ada di PDF menu lengkap)."
                  : priceText && !errors.price
                    ? `Tampil: ${rupiah(Number(priceText.replace(/\D/g, "")) || 0)}`
                    : undefined
              }
            >
              {(id, d) => (
                <input
                  id={id}
                  inputMode="numeric"
                  aria-describedby={d}
                  aria-invalid={!!errors.price}
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                  placeholder="22000"
                  className={inputCls}
                />
              )}
            </Field>
            {site.hasTasteTags && (
              <Field label="Tag rasa" optional hint="Pisahkan dengan koma, maks. 5. Contoh: Creamy, Sweet">
                {(id, d) => (
                  <input id={id} aria-describedby={d} value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputCls} />
                )}
              </Field>
            )}
          </div>
          <Field
            label="Deskripsi"
            optional={site.menuStyle !== "CAROUSEL"}
            showOn={site.menuStyle === "CAROUSEL" ? "Di bawah nama menu, tab Menu" : undefined}
          >
            {(id) => (
              <textarea
                id={id}
                rows={3}
                maxLength={300}
                value={v.description}
                onChange={(e) => setV({ ...v, description: e.target.value })}
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-x-6">
            <Checkbox label="Tersedia" checked={v.isAvailable} onChange={(isAvailable) => setV({ ...v, isAvailable })} />
            {site.menuStyle !== "CAROUSEL" && (
              <Checkbox label="Unggulan" checked={v.isFeatured} onChange={(isFeatured) => setV({ ...v, isFeatured })} />
            )}
          </div>
        </div>
      </FormDialog>
      <ConfirmDialog
        open={confirmDel}
        busy={busy}
        title="Hapus menu"
        message={`Hapus ${item?.name}? Tindakan ini tidak bisa dibatalkan.`}
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          if (!item) return;
          setBusy(true);
          const ok = await onDelete(item.id);
          setBusy(false);
          if (ok) onClose();
        }}
      />
    </>
  );
}
