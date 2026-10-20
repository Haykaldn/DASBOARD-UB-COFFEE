# Dashboard Admin UB Coffee & BREWi JAYA

Panel admin untuk dua website unit usaha PT Brawijaya Multi Usaha, **UB Coffee** dan **BREWi JAYA**. Admin
bisa mengelola booking meeting room UB Coffee dan mengubah konten kedua website tanpa developer. Dibuat
dengan Next.js 16 (App Router), React 19, TypeScript, dan Tailwind CSS v4, mengacu pada
[spesifikasi-dashboard-ub-coffee-brewi-jaya.md](spesifikasi-dashboard-ub-coffee-brewi-jaya.md).

Ada tiga menu:

| Menu | Isi |
| --- | --- |
| Meeting Room | Booking Arjuna Meeting Room, Semeru Meeting Room, dan Open Space UB Coffee |
| Konten Website UB Coffee | Publikasi (Berita & Artikel) dan bagian Landing Page |
| Publikasi BREWi JAYA | Publikasi (Berita & Artikel) |

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Untuk mode produksi, isi `AUTH_SECRET` dulu (lihat `.env.example`, buat dengan `openssl rand -base64 32`):

```bash
npm run build
npm start
```

## Akun demo

Kata sandi akun demo diatur lewat env `DEMO_PASSWORD` (lihat `.env.example`).

| Email | Akun | Menu yang bisa dibuka |
| --- | --- | --- |
| super@ubcoffee.id | Super Admin | Semua menu |
| ubcoffee@ubcoffee.id | Admin UB Coffee | Meeting Room, Konten Website UB Coffee |
| brewijaya@ubcoffee.id | Admin BREWi JAYA | Publikasi BREWi JAYA |

Menu di luar hak akses tetap tampil di sidebar dengan ikon gembok dan tidak bisa diklik. Membuka URL-nya
langsung juga ditolak di server dan dialihkan ke menu milik akun tersebut.

## Halaman

| Alamat | Isi |
| --- | --- |
| `/login` | Login dengan pesan error generik; dikunci setelah 5 kali gagal dalam 15 menit |
| `/meeting-room` | Statistik, jadwal harian semua ruang (07.00–22.00), filter, daftar booking, dialog Konfirmasi / Tolak / Batalkan / Detail, Booking Jadwal oleh admin, dan kirim WhatsApp (wa.me) |
| `/publikasi/ub-coffee` | Tab **Publikasi** (Berita & Artikel dengan tag) dan tab **Landing Page**: Foto Hero, Menu, Reservasi, Lokasi & Jam Buka, Tentang & Kontak |
| `/publikasi/brewi-jaya` | Publikasi (Berita & Artikel dengan tag) |

## Status

**Sudah:**

- Seluruh tampilan dan perilaku dashboard.
- Akses per role dicek di server (layout dan page), session cookie bertanda tangan HMAC, rate limit
  login, security headers, dan CSP dengan nonce (`proxy.ts`, `next.config.ts`).
- Lapisan data `lib/repo/` yang siap diganti Prisma/server action tanpa mengubah komponen.

**Belum:**

- Data masih contoh: diambil dari `lib/mock-data.ts` lewat `lib/repo/mock-db.ts` dan disimpan di memori
  browser, sehingga perubahan hilang saat halaman dimuat ulang.
- Database, Auth.js, upload ke object storage, API publik untuk website, dan form booking di website.

Urutan pekerjaan berikutnya ada di [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) bagian 5.7.

## Setelah mengubah kode

```bash
npm run lint
npx tsc --noEmit
npm run build      # sebelum menyatakan pekerjaan selesai (hentikan npm run dev dulu)
```

Ketiganya harus lolos tanpa error.

## Dokumen lain

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): struktur project, alur data dan bisnis, serta kesiapan
  integrasi dengan database dan website (termasuk pemetaan ke landing page UB Coffee).
- [docs/PERBEDAAN-SPESIFIKASI.md](docs/PERBEDAAN-SPESIFIKASI.md): perbedaan kode dengan spesifikasi,
  untuk memperbarui spesifikasi.
- [CLAUDE.md](CLAUDE.md): aturan kerja permanen untuk developer dan agen AI.
