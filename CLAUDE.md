# Dashboard Admin UB Coffee & BREWi JAYA

Panel admin (Next.js 16, React 19, TypeScript, Tailwind v4) untuk dua website milik PT Brawijaya Multi
Usaha: UB Coffee dan BREWi JAYA. Cara menjalankan: [README.md](README.md). Arsitektur, alur data, dan
kesiapan integrasi: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Perbedaan kode dengan spesifikasi:
[docs/PERBEDAAN-SPESIFIKASI.md](docs/PERBEDAAN-SPESIFIKASI.md).

## Cara bekerja

- Jangan mengubah, membuat, memindahkan, atau menghapus file sebelum rencana (file, perubahan, risiko)
  disetujui secara eksplisit.
- Kalau muncul perubahan di luar rencana yang disetujui, berhenti dan tanyakan dulu.
- Tampilan dan perilaku tidak boleh berubah sebagai efek samping refactor.
- Jangan menjalankan `git commit`, `push`, atau `reset` kecuali diminta.
- Jangan mengubah file di luar folder ini (termasuk folder `SIMPLE UB COFFE`).
- Jangan menambah library baru tanpa izin.

## Aturan data

- Alur: `lib/repo/*` → cache di `components/store.tsx` → hook di `components/data-hooks.tsx` → komponen.
- Komponen membaca dan mengubah data **hanya lewat hook di `components/data-hooks.tsx`**. Membaca
  ringkas dari `useStore().content` (misalnya kartu statistik) boleh, mengubah tidak.
- `setSiteCache` dan `setBookingsCache` di `store.tsx` hanya boleh dipakai oleh `data-hooks.tsx`.
- `lib/repo` hanya diimpor oleh `data-hooks.tsx` dan `store.tsx`.
- Hanya `lib/repo/mock-db.ts` yang membaca `lib/mock-data.ts`.
- `lib/repo` bebas API browser (`navigator`, `window`, `document`, `localStorage`, ...) karena nanti
  berjalan di server. Argumen dan nilai kembaliannya data biasa yang serializable (tanpa fungsi,
  instance class, atau `Date`).
- Cek koneksi, toast, dan pesan gagal ada di `run()` di `store.tsx`, bukan di repo.
- Tipe entitas hanya di `lib/types.ts`. Logika domain murni di `lib/` (`booking.ts`, `posts.ts`,
  `format.ts`, `sites.ts`), bukan di komponen.
- Setiap item yang bisa diedit admin punya `id` stabil. Jangan mengubah `id` yang sudah ada.
- Pemeriksaan penting dilakukan dua kali: di klien untuk pesan cepat, dan di repo sebagai pengaman
  (contoh: transisi status booking, slug post kembar, tag post).

## Logika bisnis (jangan diubah perilakunya tanpa izin)

- State machine status booking dan `canTransition()` di `lib/booking.ts`.
- Cek bentrok jadwal per ruang dengan jeda bersih-bersih 30 menit (`findConflict`, `BUFFER_MIN`).
- Ruangan `ROOMS`: Arjuna dan Semeru (15 orang), Open Space tanpa batas kapasitas (`overCapacity`).
- Jenis publikasi `POST_TYPES` (Berita, Artikel) dan aturan tag: 1–3 tag, terikat jenis, slug unik per situs.
- Validasi form, template pesan WhatsApp (`waLink`), dan hak akses (`lib/sites.ts`).

## Keamanan (jangan disentuh tanpa izin)

`lib/auth.ts`, `lib/ratelimit.ts`, `proxy.ts`, `next.config.ts`, dan `app/(auth)/login/`.
Akses per role selalu dicek di server (layout dan page); menyembunyikan menu bukan otorisasi.

## Next.js 16

Versi ini punya perubahan besar dari versi sebelumnya (misalnya `proxy.ts` menggantikan `middleware.ts`).
Baca panduan di `node_modules/next/dist/docs/` sebelum menulis kode yang memakai API Next.js.

## Perintah

- `npm run lint` dan `npx tsc --noEmit` setelah setiap perubahan; keduanya harus lolos tanpa error
  dan peringatan.
- `npm run build` sebelum menyatakan pekerjaan selesai (hentikan `npm run dev` dulu).
