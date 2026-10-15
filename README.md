# Dashboard Admin — UB Coffee & BREWi JAYA

Implementasi tampilan dashboard sesuai [spesifikasi-dashboard-ub-coffee-brewi-jaya.md](spesifikasi-dashboard-ub-coffee-brewi-jaya.md) §3 (Next.js 16, App Router, TypeScript, Tailwind v4).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Login dengan akun demo (kata sandi `brawijaya-admin-2026`):

| Email | Akun | Menu yang bisa diakses |
|---|---|---|
| super@ubcoffee.id | Super Admin | Semua menu |
| ubcoffee@ubcoffee.id | Admin UB Coffee | Meeting Room UB Coffee, Publikasi UB Coffee |
| brewijaya@ubcoffee.id | Admin BREWi JAYA | Publikasi BREWi JAYA |

Menu di luar hak akses tetap tampil di sidebar dengan ikon gembok, tetapi tidak bisa diklik. Membuka URL-nya langsung juga ditolak di server (dialihkan ke menu milik akun tersebut).

Untuk `npm run build && npm start`, isi `AUTH_SECRET` (lihat `.env.example`).

## Halaman

- `/login` — login, pesan error generik, kunci 5 percobaan / 15 menit.
- `/meeting-room` — statistik, filter, daftar booking, kalender harian 07.00–22.00, dialog Konfirmasi / Tolak / Detail / Blokir Jadwal, kirim WA (wa.me).
- `/publikasi/ub-coffee` dan `/publikasi/brewi-jaya` — Foto Hero, Tentang & Kontak, Menu, Event & Promo, Galeri (BREWi JAYA), Lokasi & Jam Buka.

## Status

- **Sudah:** seluruh UI §3, akses per role dicek di server (layout/page), session cookie HMAC, security headers + CSP nonce (`proxy.ts`, `next.config.ts`).
- **Belum (data contoh):** data dari `lib/mock-data.ts` dan disimpan di memori browser; perubahan hilang saat halaman di-refresh. `save()` di `components/store.tsx` adalah titik sambung ke server action + Prisma (milestone 1–11 di §16). Auth demo di `lib/auth.ts` diganti Auth.js + argon2id.
