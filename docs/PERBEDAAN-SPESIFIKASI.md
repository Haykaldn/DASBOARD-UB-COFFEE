# Perbedaan Kode dengan Spesifikasi

Catatan ini membandingkan kode dashboard sekarang dengan
[spesifikasi-dashboard-ub-coffee-brewi-jaya.md](../spesifikasi-dashboard-ub-coffee-brewi-jaya.md), supaya
spesifikasi bisa diperbarui. Nomor bagian merujuk ke spesifikasi. Alasan keputusan dan rencana
lanjutannya ada di [ARCHITECTURE.md](ARCHITECTURE.md) bagian 5.4 sampai 5.7.

Arti kolom **Status**:

- **Keputusan**: sengaja berbeda; spesifikasi perlu disesuaikan dengan kode.
- **Berubah saat implementasi**: tampilan atau alur diubah saat dibangun; spesifikasi perlu disesuaikan.
- **Belum dikerjakan**: spesifikasi tetap berlaku, kodenya menyusul.
- **Perlu diputuskan**: belum ada keputusan.

## Menu, akses, dan tata letak

| Topik | Spesifikasi | Kode sekarang | Status |
| --- | --- | --- | --- |
| Nama menu | Bagian 2.1: Meeting Room UB Coffee, Publikasi UB Coffee, Publikasi BREWi JAYA | Meeting Room, Konten Website UB Coffee, Publikasi BREWi JAYA | Berubah saat implementasi |
| Role | Bagian 7 dan 10.1: `SUPER_ADMIN`, `PUBLISHER` per situs, `MEETING_ADMIN` | `SUPER_ADMIN` dan `SITE_ADMIN` per situs; admin UB Coffee otomatis memegang Meeting Room (`lib/sites.ts`) | Keputusan |
| Menu di luar hak akses | Bagian 3.3 dan 10.1: tidak ditampilkan | Tetap tampil di sidebar dengan ikon gembok, tidak bisa diklik; URL langsung ditolak di server | Berubah saat implementasi |
| Sidebar dan header | Bagian 3.2 dan 3.3: sidebar gelap 260 px; header putih berisi "Lihat situs", nama admin, tombol keluar | Sidebar putih 240 px berisi nama admin dan tombol keluar; banner navy berisi judul halaman dan "Lihat situs" | Berubah saat implementasi |
| Tampilan HP | Bagian 3.3: sidebar pindah ke atas selebar layar | Sidebar menjadi laci yang dibuka dari tombol panel | Berubah saat implementasi |
| Kepala halaman | Bagian 3.3: judul 30 px, deskripsi, tombol aksi utama di kanan | Judul dan deskripsi di banner navy; tombol aksi ada di kartu section (misalnya Booking Jadwal, Tambah Publikasi) | Berubah saat implementasi |

## Meeting Room

| Topik | Spesifikasi | Kode sekarang | Status |
| --- | --- | --- | --- |
| Tempat booking | Bagian 2.1 dan 7: satu ruang, kapasitas 15 | 3 tempat: Arjuna Meeting Room dan Semeru Meeting Room (15 orang), Open Space (tanpa batas kapasitas); id sama dengan landing page | Keputusan |
| Kartu statistik ke-4 | Bagian 3.5: "Kapasitas ruang: 15 orang" | "Tempat booking: 3" | Keputusan |
| Kalender | Bagian 3.5: kolom kanan (maks. 380 px), grid jam tegak, satu ruang | Di atas daftar booking, satu baris per ruang, sumbu jam mendatar 07.00–22.00; klik area kosong membuat booking di ruang itu | Berubah saat implementasi |
| Tombol utama | Bagian 3.5: "+ Blokir Jadwal" | "Booking Jadwal": admin memasukkan reservasi langsung, otomatis berstatus Dikonfirmasi | Berubah saat implementasi |
| Membuat Blokir Jadwal | Bagian 3.5: dialog tanggal, jam, keterangan internal | Belum ada UI untuk membuat blokir; blokir yang ada hanya bisa dilihat dan dihapus | Perlu diputuskan |
| Filter status | Bagian 3.5: tombol pil, mulai dari Semua | Dropdown dengan jumlah per status; default "Menunggu konfirmasi"; "Selesai" ikut memuat Tidak hadir | Berubah saat implementasi |
| Batas booking | Bagian 9.3: mulai minimal 3 jam dari sekarang, maksimal 30 hari ke depan, durasi 60–240 menit | Booking Jadwal oleh admin hanya mengecek: tanggal tidak lewat, hari buka, di dalam jam buka, kapasitas, dan bentrok + jeda 30 menit | Perlu diputuskan (menunggu jawaban owner bagian 17) |
| Kedaluwarsa booking Menunggu | Bagian 9.1: otomatis batal setelah [24] jam | Belum ada | Belum dikerjakan |
| Form booking di website, Turnstile, rate limit, notifikasi email | Bagian 9.1, 9.4, 9.5 | Belum ada (website belum tersambung) | Belum dikerjakan |

## Publikasi

| Topik | Spesifikasi | Kode sekarang | Status |
| --- | --- | --- | --- |
| Susunan halaman | Bagian 3.6: satu halaman berisi semua section berurutan, dengan baris pintasan | UB Coffee: dua tab, **Publikasi** dan **Landing Page** (kartu per bagian, klik untuk membuka editornya) | Berubah saat implementasi |
| Isi menu BREWi JAYA | Bagian 2.2 dan 3.6: Foto Hero, Tentang & Kontak, Menu, Event & Promo, Galeri, Lokasi | Hanya Publikasi. Data contoh hero, menu, galeri, dan outlet masih ada, tetapi tidak ditampilkan | Keputusan |
| Jenis publikasi | Bagian 2.2, 3.6, dan 7: UB Coffee Event / Promo / Info tanpa halaman detail; BREWi JAYA Event / Promo / Menu Baru | Kedua situs: **Berita** dan **Artikel** (tetap, tidak bisa ditambah admin), dengan halaman detail | Keputusan (permintaan mentor) |
| Tag | Tidak ada (hanya label tipe) | Tag sebagai data per situs `{ id, slug, label, type }`: 1–3 per post, terikat jenis, slug unik per situs, admin bisa menambah tag dari dropdown | Keputusan (permintaan mentor) |
| Status publikasi | Bagian 3.6 dan 7: Draf / Tayang / Terjadwal (`DRAFT`, `PUBLISHED`) | Draft / Terbit / Arsip (`ARCHIVED` baru); label otomatis Tayang, Terjadwal, atau Berakhir dari tanggal | Berubah saat implementasi |
| Periode tayang | Bagian 3.6 dan 7: periode tayang opsional (`startsAt`, `endsAt`) | Tidak ada di editor; nilainya dikosongkan saat post disimpan | Berubah saat implementasi |
| Editor publikasi | Bagian 3.6: dialog | Halaman penuh di dalam tab, dengan panel SEO (Meta Title, Meta Description, tags SEO, pratinjau Google) | Berubah saat implementasi |
| Alamat detail berita | Bagian 8: `GET /posts/[slug]` untuk halaman detail | Field Slug menampilkan petunjuk "/news/<slug>", padahal detail berita UB Coffee dibuka di panel landing page | Perlu disesuaikan |
| Kartu statistik Publikasi | Bagian 3.6: Menu tersedia, Event & promo tayang, Foto hero / galeri, Outlet | UB Coffee: Menu tersedia, Artikel & berita tayang, Foto hero, Outlet. BREWi JAYA: Tayang, Terjadwal, Draft, Total publikasi | Berubah saat implementasi |
| Info reservasi UB Coffee | Bagian 3.6: satu blok info meeting room | Sama (satu blok), sedangkan landing page menampilkan kartu per ruang | Perlu diputuskan |

## Teknis dan keamanan

| Topik | Spesifikasi | Kode sekarang | Status |
| --- | --- | --- | --- |
| Framework | Bagian 5: Next.js 15 | Next.js 16; `proxy.ts` menggantikan `middleware.ts` | Keputusan |
| UI library | Bagian 5: Tailwind + shadcn/ui, TanStack Table | Tailwind v4 dengan komponen sendiri (`components/ui.tsx`), tanpa library tambahan | Berubah saat implementasi |
| Struktur kode data | Bagian 6.1: `features/*` berisi actions, schema, queries | `lib/repo/*` (lapisan data async per entitas) + `components/data-hooks.tsx`; siap diganti server action + Prisma | Keputusan |
| Database, Prisma, Zod | Bagian 5 dan 7 | Belum ada; data contoh di `lib/repo/mock-db.ts` | Belum dikerjakan |
| Skema data | Bagian 7 | Tambahan dan perubahan: `MeetingRoom` menjadi 3 ruang dengan kapasitas opsional; `PostType` hanya `BERITA` / `ARTIKEL`; model `PostTag` baru; `PublishStatus` mendapat `ARCHIVED`; jam buka di dashboard memakai index 0 = Senin, sedangkan skema memakai 0 = Minggu | Keputusan (skema perlu diperbarui) |
| Auth | Bagian 10.3: Auth.js + argon2id, session di database | Akun demo dengan kata sandi dari env `DEMO_PASSWORD` (wajib di production) dan cookie bertanda tangan HMAC | Belum dikerjakan |
| Umur session | Bagian 10.3: 8 jam idle, 7 hari maksimal | 8 jam tetap | Belum dikerjakan |
| Rate limit login | Bagian 5 dan 10.3: Upstash Redis | Di memori satu server (`lib/ratelimit.ts`), aturan 5 kali / 15 menit sama | Belum dikerjakan |
| Upload gambar | Bagian 11: dicek di server, re-encode `sharp`, object storage | Dicek di browser saja (WebP, maks. 500 KB) | Belum dikerjakan |
| Batas upload | Bagian 11 tidak konsisten: teks menyebut WebP ≤ 500 KB, contoh kode memakai 5 MB JPEG/PNG/WebP | Mengikuti teks: WebP ≤ 500 KB | Perlu diputuskan (spesifikasi perlu dirapikan) |
| API publik | Bagian 8: `/api/public/[site]/*` | Belum ada. Endpoint tag, ruangan, dan info reservasi perlu ditambahkan ke daftar (ARCHITECTURE.md bagian 5.2) | Belum dikerjakan |
| Security headers dan CSP | Bagian 12 | Sudah: header di `next.config.ts`, CSP dengan nonce di `proxy.ts`, `noindex` | Sesuai |
| Audit log, backup, monitoring | Bagian 12 dan 14 | Belum ada | Belum dikerjakan |
