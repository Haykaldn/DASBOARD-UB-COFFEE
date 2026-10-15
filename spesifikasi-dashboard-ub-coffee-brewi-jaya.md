# Spesifikasi Dashboard Admin — UB Coffee & BREWi JAYA

Dokumen ini menjelaskan **tampilan, fitur, dan rancangan teknis** dashboard admin untuk dua website milik unit usaha PT Brawijaya Multi Usaha.

| Item | Keterangan |
|---|---|
| Website UB Coffee | https://ub-coffee.vercel.app (Next.js, Vercel) |
| Website BREWi JAYA | https://brewi-jaya.vercel.app (Next.js, Vercel) |
| Mockup dashboard (interaktif) | https://claude.ai/artifact/RAQ121jWYVrUDWU4QZAnuz |
| Referensi gaya | Dashboard admin yubikost (sidebar ringkas, kartu statistik, konten berupa kartu) |
| Status dokumen | Draf untuk review mentor dan owner |

## Daftar isi

1. Ringkasan
2. Ruang lingkup
3. Spesifikasi tampilan
4. Arsitektur
5. Stack
6. Struktur project
7. Skema database
8. API untuk website publik
9. Meeting room UB Coffee (logika)
10. Auth, role, dan otorisasi
11. Upload gambar
12. Checklist security
13. Environment variables
14. Deployment, domain, backup
15. Migrasi data lama
16. Urutan pengerjaan
17. Pertanyaan untuk owner

---

## 1. Ringkasan

Saat ini isi kedua website (menu, berita, outlet, foto) masih ditulis langsung di kode, sehingga setiap perubahan harus lewat developer dan redeploy. Dashboard ini memindahkan pengelolaan konten ke admin, dan menambahkan fitur **booking meeting room UB Coffee** dari website.

Tujuan:
- Admin bisa mengubah konten kedua website tanpa developer.
- Pengunjung UB Coffee bisa booking meeting room lewat form di website, dan admin mengonfirmasinya dari dashboard.
- Satu dashboard untuk dua website, dengan tampilan sederhana: **3 menu saja**.

---

## 2. Ruang lingkup

### 2.1 Menu dashboard

| # | Menu | Fungsi |
|---|---|---|
| 1 | **Meeting Room UB Coffee** | Kelola booking meeting room (kapasitas 15 orang) yang masuk dari form website UB Coffee |
| 2 | **Publikasi UB Coffee** | Semua perubahan konten website UB Coffee dalam satu halaman |
| 3 | **Publikasi BREWi JAYA** | Semua perubahan konten website BREWi JAYA dalam satu halaman |

### 2.2 Yang bisa dan tidak bisa diubah

| Bagian website | UB Coffee | BREWi JAYA |
|---|---|---|
| Judul hero | ❌ Terkunci (tetap di kode) | ❌ Terkunci (tetap di kode) |
| Foto hero | ✅ Slideshow banyak foto (saat ini 17) | ✅ Satu foto |
| Tentang kami | ✅ Tagline di footer | ✅ Paragraf section "Tempat Buat Lama-Lama" |
| Instagram | ✅ | ✅ |
| Link menu lengkap (PDF) | ✅ Tombol "Lihat Menu Lengkap" | — (punya halaman `/menu`) |
| Menu | ✅ | ✅ (dengan tag rasa) |
| Event & Promo | ✅ | ✅ (tipe Event / Promo / Menu Baru, ada halaman detail) |
| Galeri | — (tidak ada di website) | ✅ |
| Lokasi & jam buka | ✅ 2 lokasi | ✅ 5 outlet |
| Reservasi | ✅ Meeting room via form | — Tetap via WhatsApp per outlet |

### 2.3 Di luar scope (fase ini)

Reservasi meja, reservasi BREWi JAYA lewat form, POS/kasir, pembayaran online, loyalty, multi-bahasa.

---

## 3. Spesifikasi tampilan

### 3.1 Prinsip desain

- **Bersih, flat, fungsional**: fokus ke keterbacaan dan kecepatan kerja admin, bukan dekorasi.
- **Tidak ada scroll horizontal** dan **tidak ada teks/tombol yang terpotong atau bertindihan** di ukuran layar mana pun. Daftar data memakai baris/kartu yang membungkus (wrap), bukan tabel lebar.
- **Navigasi minimal**: sidebar 3 menu, tanpa sub-menu atau tab. Semua yang bisa diubah langsung terlihat di halaman.
- Setiap field memberi tahu **di mana hasilnya tampil** di website ("Tampil di: …").
- Aksesibel: tombol dan input asli (`<button>`, `<input>`, `<label>`), target sentuh minimal 40–44 px, kontras teks minimal 4.5:1, ikon tanpa teks diberi `aria-label`.

### 3.2 Token desain

| Token | Nilai |
|---|---|
| Font | Plus Jakarta Sans (400–800), fallback `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Warna utama (tombol, aktif) | Navy `#0B2A5B` (hover `#081F45`) |
| Sidebar | `#0B1B3A`, item aktif `#1E4A8F` |
| Latar halaman | `#F3F5F9` |
| Kartu | Putih, border `#E3E8EF`, radius 16 px |
| Teks | Utama `#0F172A`, sekunder `#475569`, keterangan `#64748B` |
| Badge notifikasi | Kuning `#FACC15`, teks gelap |
| Status | Menunggu: `#FEF3C7`/`#92400E` · Dikonfirmasi/Tersedia/Tayang: `#DCFCE7`/`#166534` · Selesai/Ditolak/Blokir: `#E2E8F0`/`#334155` · Terjadwal: kuning · Habis: kuning |
| Ikon | Garis (stroke) 1.5–2 px, tanpa emoji |

### 3.3 Layout global

```
┌───────────────┬──────────────────────────────────────────────────────┐
│ [UB] Panel    │                     Lihat situs ↗   Nama Admin   ⎋   │ ← header putih
│ Konten  Admin ├──────────────────────────────────────────────────────┤
│               │ Judul Halaman                        [+ Aksi Utama] │
│ ▣ Meeting     │ Deskripsi singkat halaman                           │
│   Room    (3) │                                                      │
│ ▢ Publikasi   │ [stat] [stat] [stat] [stat]                          │
│   UB Coffee   │                                                      │
│ ▢ Publikasi   │ … konten halaman (kartu-kartu) …                     │
│   BREWi JAYA  │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

- **Sidebar** (kiri, lebar tetap 260 px): logo + label "Admin", 3 menu dengan ikon. Menu aktif berlatar biru `#1E4A8F`. Badge kuning di Meeting Room menunjukkan jumlah booking **Menunggu**. Menu hanya tampil sesuai role user.
- **Header** (atas, putih): "Lihat situs ↗" (membuka website sesuai halaman aktif), nama dan role admin, tombol keluar.
- **Kepala halaman**: judul besar (30 px, tebal), deskripsi 1–2 kalimat, tombol aksi utama di kanan.
- **Kartu statistik**: 4 kartu sejajar, masing-masing ikon dalam kotak berwarna lembut, angka besar, dan label.

**Responsif:**

| Lebar layar | Perilaku |
|---|---|
| > 1000 px | Sidebar di kiri, konten 2 kolom di halaman Meeting Room (daftar + kalender) |
| 761–1000 px | Sidebar tetap di kiri. Kalender pindah ke bawah daftar booking |
| ≤ 760 px (HP) | Sidebar pindah ke atas (selebar layar). Semua kartu 1 kolom, kartu statistik 2 kolom |

### 3.4 Halaman Login

- Kartu di tengah: logo, judul "Masuk Admin", field **Email** dan **Kata sandi**, tombol **Masuk**.
- Pesan error generik: "Email atau kata sandi salah" (tidak memberi tahu mana yang salah).
- Setelah 5 kali gagal: "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
- Tidak ada pendaftaran publik. Akun dibuat oleh Super Admin.

### 3.5 Menu 1 — Meeting Room UB Coffee

**Kepala halaman:** judul "Meeting Room UB Coffee", deskripsi alur, tombol utama **+ Blokir Jadwal** (untuk menutup slot keperluan internal).

**Kartu statistik:**

| Kartu | Isi |
|---|---|
| Menunggu konfirmasi | Jumlah booking status Menunggu |
| Dikonfirmasi | Jumlah booking terkonfirmasi yang akan datang |
| Booking hari ini | Jumlah booking (menunggu + dikonfirmasi) di hari ini |
| Kapasitas ruang | 15 orang |

**Kartu filter:** kolom cari (nama pemesan, instansi, atau kode), pilih tanggal, dan tombol filter status berbentuk pil: Semua · Menunggu · Dikonfirmasi · Selesai · Ditolak, masing-masing dengan jumlahnya.

**Area utama (2 kolom):**

*Kiri — daftar booking.* Satu booking = satu baris dengan 2 bagian:

```
┌──────────────────────────────────────────────────────┬────────────────────────┐
│ Rina A.   MR-1017-7KQ2 · 0812-xxxx-1021               │            [Menunggu] │
│ Rapat divisi pemasaran                                │ [Konfirmasi] [Tolak]  │
│ Sab, 17 Okt · 09.00 – 11.00 · 12 orang                │                        │
└──────────────────────────────────────────────────────┴────────────────────────┘
```

- Kiri: nama + kode + nomor HP, keperluan (boleh turun baris), lalu tanggal · jam · jumlah peserta.
- Kanan: label status di atas, tombol aksi di bawah. Lebar kolom kanan mengikuti tombol, jadi tidak pernah menimpa teks.
- Aksi per status:

| Status | Tombol |
|---|---|
| Menunggu | **Konfirmasi** (utama), **Tolak** (wajib isi alasan di dialog) |
| Dikonfirmasi | **Detail** (di dalamnya: Kirim WA, Batalkan, Tandai Selesai / Tidak Hadir) |
| Selesai, Ditolak, Dibatalkan | **Detail** |

*Kanan — kalender harian* (lebar maksimal 380 px), bergaya Google Calendar:
- Atas: judul "Jadwal ruang", tombol **Hari ini**, navigasi **‹ tanggal ›** untuk pindah ke hari sebelum/sesudah, dan keterangan warna.
- Grid per jam **07.00 sampai 22.00** (satu jam = 48 px, total 15 jam).
- Booking tampil sebagai blok dengan posisi dan tinggi sesuai jam mulai–selesai. Isi blok: nama (dipotong dengan "…" jika terlalu panjang) dan rentang jam.
- Warna blok: kuning = menunggu, hijau = dikonfirmasi/selesai, abu-abu = blokir internal. Booking ditolak/dibatalkan tidak tampil (slot kembali kosong).
- Hari tanpa booking menampilkan "Belum ada booking di hari ini".
- Klik blok membuka detail booking yang sama dengan tombol Detail.
- Rentang jam grid mengikuti jam buka UB Coffee hari itu. Di luar jam buka diberi latar abu-abu muda.

**Dialog yang dibutuhkan:**

| Dialog | Isi |
|---|---|
| Konfirmasi booking | Ringkasan booking, catatan admin (opsional), tombol Konfirmasi. Setelah itu muncul tombol "Kirim WA ke pemesan" |
| Tolak booking | Alasan penolakan (wajib), tombol Tolak |
| Detail booking | Semua data booking, riwayat perubahan status, tombol aksi sesuai status |
| Blokir jadwal | Tanggal, jam mulai, jam selesai, keterangan internal |

### 3.6 Menu 2 & 3 — Publikasi UB Coffee / BREWi JAYA

Satu halaman yang sama untuk kedua situs, berisi section berurutan (tanpa tab). Section yang tidak dimiliki situs tidak ditampilkan.

**Urutan section mengikuti susunan website** (`SiteConfig.sections`), dengan baris pintasan "lompat ke section" di bawah kartu statistik:

| Situs | Urutan |
|---|---|
| UB Coffee | Foto Hero → Menu → Reservasi → Lokasi & Jam Buka → Event & Promo → Tentang & Kontak (mengikuti hero → tab "Jelajahi UB Coffee": Menu · Reservasi · Lokasi · Event & Promo → Tentang → footer) |
| BREWi JAYA | Foto Hero → Tentang & Kontak → Menu → Event & Promo → Galeri → Lokasi & Jam Buka |

**Penyesuaian UB Coffee (website versi tab "Jelajahi"):**
- **Menu** tampil sebagai carousel tanpa harga: kartu menampilkan deskripsi (bukan harga), urutan bisa diseret (= urutan carousel), harga opsional, tanpa "Unggulan". Link menu lengkap (PDF) diatur di section ini.
- **Reservasi** *(baru)*: deskripsi, kapasitas, harga sewa (Internal UB / Eksternal), fasilitas gratis, foto ruangan (berurutan), paket meeting (nama, deskripsi, harga per N orang, tambahan per orang), keterangan paket, pilihan snack, dan cara pemesanan. Jadwal booking tetap di menu Meeting Room.
- **Lokasi**: tambahan field **Patokan** di bawah alamat. Outlet pertama juga mengisi jam buka di hero.
- **Event & Promo**: tipe Event / Promo / Info, tanpa halaman detail (tanpa slug dan isi); teks singkat wajib.

**Kepala halaman:** judul "Publikasi {nama situs}", deskripsi, tombol utama **+ Tambah Menu**.

**Kartu statistik:**

| Kartu | UB Coffee | BREWi JAYA |
|---|---|---|
| 1 | Menu tersedia (contoh 8/9) | Menu tersedia (contoh 12/13) |
| 2 | Event & promo tayang | Event & promo tayang |
| 3 | Foto hero (slideshow) | Foto galeri |
| 4 | Outlet | Outlet |

**Section 1 — Foto Hero**
- Info terkunci (ikon gembok): "**Judul hero: {nama situs}** — terkunci, tidak dapat diubah dari dashboard."
- **UB Coffee (slideshow):** grid foto berurutan, tiap foto diberi nomor urut dan tombol hapus (ikon tempat sampah). Tile "+ Tambah" di akhir grid dan tombol "+ Tambah Foto" di kepala section. Foto bisa diseret untuk mengubah urutan. Keterangan: disarankan foto landscape, lebar minimal 1920 px.
- **BREWi JAYA (satu foto):** pratinjau foto 16:9 dengan tombol **Ganti foto**.

**Section 2 — Tentang & Kontak** (tombol **Simpan** sendiri)

| Field | Tipe | Tampil di (UB Coffee) | Tampil di (BREWi JAYA) |
|---|---|---|---|
| Tentang kami | Textarea, maks. 500 karakter | Tagline di footer, di bawah logo | Section "Tempat Buat Lama-Lama" |
| Instagram | Teks (`@username`) | Link Instagram di Kontak/footer | Ikon Instagram di footer |
| Link menu lengkap (PDF) | URL `https://` | Tombol "Lihat Menu Lengkap" | Tidak ditampilkan |

**Section 3 — Menu**
- Kepala: jumlah item ("Menampilkan 9 dari 9 item"), tombol **+ Tambah Menu**.
- Filter kategori berbentuk pil: Semua · Kopi · Non-Kopi · Makanan.
- Grid kartu menu (lebar minimal 220 px per kartu). Isi kartu: foto 4:3 (ikon placeholder jika belum ada foto), label kategori dan status (Tersedia/Habis) di pojok foto, nama, tag rasa (BREWi JAYA), harga, centang **Tersedia** (langsung tersimpan), dan tombol **Edit**.
- Dialog Tambah/Edit menu: foto, nama, kategori, harga (angka, rupiah), deskripsi, tag rasa, tersedia, unggulan, serta tombol hapus (dengan konfirmasi).

**Section 4 — Event & Promo**
- Grid kartu: poster 16:9, label tipe (Event / Promo / Menu Baru) dan status (Tayang / Terjadwal / Draf), judul, tanggal/periode, tombol **Edit**.
- Dialog Tambah/Edit: tipe, judul, slug (otomatis dari judul, bisa diubah), ringkasan, isi (editor Markdown sederhana), poster, tanggal terbit, periode tayang (opsional), status.

**Section 5 — Galeri** *(hanya BREWi JAYA)*
- Grid foto persegi dengan keterangan dan tombol edit, tombol **+ Unggah Foto**, seret untuk mengubah urutan.

**Section 6 — Lokasi & Jam Buka**
- Grid kartu outlet: nama, alamat, jam buka (beberapa baris), nomor WA, tombol **Edit**. Tombol **+ Tambah Outlet**.
- Dialog Edit outlet: nama, alamat, link Google Maps, nomor WA, aktif/nonaktif, dan jam buka per hari (Senin–Minggu, masing-masing jam buka, jam tutup, atau libur).
- Di BREWi JAYA, nomor WA outlet dipakai tombol "Chat via WhatsApp" di section Reservasi website.

### 3.7 Pola interaksi umum

| Situasi | Perilaku |
|---|---|
| Simpan berhasil | Toast di pojok kanan bawah: "Perubahan disimpan. Website diperbarui." |
| Simpan gagal | Toast merah dengan pesan umum, data di form tidak hilang |
| Hapus data | Dialog konfirmasi: "Hapus {nama}? Tindakan ini tidak bisa dibatalkan." |
| Memuat data | Skeleton (kotak abu-abu) di posisi kartu/baris |
| Data kosong | Teks penjelasan + tombol tambah, misalnya "Belum ada event. Tambah event pertama." |
| Form | Validasi langsung di bawah field, tombol Simpan nonaktif selama proses |
| Upload foto | Progress bar, pratinjau langsung, pesan jelas jika tipe/ukuran ditolak |
| Perubahan belum disimpan | Peringatan saat meninggalkan halaman |

### 3.8 Komponen yang dipakai ulang

`Sidebar`, `TopBar`, `PageHeader`, `StatCard`, `FilterBar`, `StatusChip`, `PillFilter`, `SectionCard`, `ItemCard`, `BookingRow`, `DayCalendar`, `ImageUploader`, `SortableGrid`, `FormDialog`, `ConfirmDialog`, `Toast`, `LockedNotice`, `FieldHint` ("Tampil di: …").

---

## 4. Arsitektur

```
                       ┌────────────────────────────┐
  Admin (browser) ───► │  CMS (Next.js, project baru) │──► PostgreSQL
                       │  - Dashboard (3 menu)        │──► Object storage (R2 / Vercel Blob)
                       │  - API /api/public/[site]/*  │──► Email (Resend) / WhatsApp
                       └──────────────┬───────────────┘
                     server-to-server │ (API key per situs)
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
     ub-coffee (Next.js)                         brewi-jaya (Next.js)
     - fetch konten saat build/ISR               - fetch konten saat build/ISR
     - form booking meeting room → CMS           - reservasi tetap WhatsApp per outlet
     - /api/revalidate (dipanggil CMS)           - /api/revalidate (dipanggil CMS)
```

Prinsip:
- **CMS = satu-satunya sumber data.** Website publik tidak menyimpan data menu/event lagi, cukup menampilkan.
- **Website publik hanya bicara ke CMS dari server** (Server Component / Server Action). Browser pengunjung tidak pernah memanggil API CMS langsung, jadi CORS bisa ditutup total dan API key aman.
- **Konten di-cache (ISR) dan di-revalidate on-demand**: setiap admin menyimpan, CMS memanggil `/api/revalidate` di website terkait, sehingga perubahan tampil dalam hitungan detik tanpa redeploy.

---

## 5. Stack

| Bagian | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Sama dengan kedua website |
| Database | PostgreSQL (Neon/Supabase, atau VPS) | Relasional, transaksi untuk reservasi |
| ORM | Prisma | Prepared statement otomatis, migrasi |
| Auth | Auth.js v5 (Credentials) + session di DB | Login email/password, session bisa dicabut |
| Hash password | argon2id (`@node-rs/argon2`) | Standar OWASP |
| Validasi | Zod | Dipakai bersama untuk form dan API |
| UI dashboard | Tailwind + shadcn/ui, TanStack Table | Flat, fungsional, cepat dibangun |
| Storage gambar | Cloudflare R2 (S3 API) atau Vercel Blob | Murah, CDN |
| Proses gambar | sharp | Re-encode ke WebP, resize |
| Rate limit | Upstash Redis (`@upstash/ratelimit`) | Jalan di serverless |
| Anti-spam form | Cloudflare Turnstile | Gratis, tanpa puzzle |
| Notifikasi | Email (Resend) + WhatsApp (lihat §9.5) | |

---

## 6. Struktur project

### 6.1 Project baru: `cms`

```
cms/
├─ app/
│  ├─ (auth)/login/page.tsx
│  ├─ (dashboard)/
│  │  ├─ layout.tsx            # sidebar 3 menu + guard login
│  │  ├─ meeting-room/page.tsx # menu 1
│  │  └─ publikasi/[site]/     # menu 2 & 3 (site = ub-coffee | brewi-jaya)
│  │     └─ page.tsx           # satu halaman: Foto Hero, Tentang & Kontak, Menu, Event & Promo, Galeri*, Lokasi
│  │                           # edit/tambah lewat dialog (modal) per item
│  └─ api/public/[site]/
│     ├─ settings/route.ts
│     ├─ hero/route.ts
│     ├─ menu/route.ts
│     ├─ posts/route.ts
│     ├─ posts/[slug]/route.ts
│     ├─ gallery/route.ts
│     ├─ outlets/route.ts
│     ├─ meeting-room/availability/route.ts   # hanya ub-coffee
│     └─ meeting-room/bookings/route.ts       # hanya ub-coffee
├─ components/                 # DataTable, ImageUploader, FormField, StatusChip, ...
├─ features/                   # per modul: actions.ts (server actions), schema.ts (zod), queries.ts
│  ├─ hero/  ├─ menu/  ├─ posts/  ├─ gallery/  ├─ outlets/  ├─ meeting-room/  └─ settings/
├─ lib/
│  ├─ db.ts                    # Prisma client singleton
│  ├─ auth.ts                  # Auth.js config
│  ├─ guard.ts                 # requireSiteAccess(), requireOutletAccess()
│  ├─ public-api.ts            # verifikasi API key situs
│  ├─ storage.ts               # upload/hapus objek
│  ├─ image.ts                 # validasi + konversi WebP
│  ├─ revalidate.ts            # panggil /api/revalidate website publik
│  ├─ ratelimit.ts
│  ├─ turnstile.ts
│  ├─ notify.ts                # email / WhatsApp
│  └─ audit.ts
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts                  # migrasi data hardcode lama
├─ middleware.ts               # redirect ke /login jika belum login
└─ next.config.ts              # security headers
```

### 6.2 Perubahan di `ub-coffee` dan `brewi-jaya`

Desain tidak berubah. Yang diganti hanya sumber data:

```
lib/cms.ts                      # fetch ke CMS (server only)
app/api/revalidate/route.ts     # dipanggil CMS saat konten berubah
# khusus ub-coffee:
app/meeting-room/actions.ts     # server action form booking
components/MeetingRoomForm.tsx  # form + Turnstile
```

Data hardcode (array menu, berita, outlet, galeri) dihapus setelah halaman memakai `lib/cms.ts`.

---

## 7. Skema database (Prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db   { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role          { SUPER_ADMIN PUBLISHER MEETING_ADMIN }
enum PostType      { EVENT PROMO MENU_BARU }
enum PublishStatus { DRAFT PUBLISHED }
enum HeroMode      { SINGLE SLIDESHOW }
enum BookingStatus { PENDING CONFIRMED REJECTED CANCELLED COMPLETED NO_SHOW }

model Site {
  id         String   @id @default(cuid())
  slug       String   @unique              // "ub-coffee", "brewi-jaya"
  name       String
  baseUrl    String                        // untuk revalidate
  apiKeyHash String                        // hash API key situs, bukan plaintext
  heroMode   HeroMode @default(SINGLE)     // UB Coffee: SLIDESHOW, BREWi JAYA: SINGLE
  hasGallery Boolean  @default(false)      // UB Coffee: false, BREWi JAYA: true
  heroSlides HeroSlide[]
  settings   SiteSetting[]
  outlets    Outlet[]
  categories MenuCategory[]
  items      MenuItem[]
  posts      Post[]
  gallery    GalleryItem[]
  media      Media[]
  members    Membership[]
}

model SiteSetting {                      // "Tentang & Kontak" sebagai key-value tervalidasi
  id     String @id @default(cuid())
  siteId String
  key    String                          // about, social.instagram, menu.pdfUrl (judul hero TIDAK disimpan; foto hero di HeroSlide)
  value  Json
  site   Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([siteId, key])
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  memberships  Membership[]
  sessions     Session[]
  createdAt    DateTime @default(now())
}

model Membership {
  id        String @id @default(cuid())
  userId    String
  siteId    String?                       // null = SUPER_ADMIN (semua situs)
  role      Role                          // PUBLISHER: per situs; MEETING_ADMIN: siteId = ub-coffee
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  site      Site?  @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([userId, siteId])
}

model Session {                           // session DB (Auth.js adapter)
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Media {
  id        String   @id @default(cuid())
  siteId    String
  key       String   @unique              // path di storage: sites/{siteId}/{uuid}.webp
  width     Int
  height    Int
  bytes     Int
  alt       String   @default("")
  createdBy String
  createdAt DateTime @default(now())
  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
}

model Outlet {
  id               String   @id @default(cuid())
  siteId           String
  name             String
  slug             String
  address          String
  mapsUrl          String?
  lat              Float?
  lng              Float?
  whatsapp         String                // format E.164: 6282132245897
  sortOrder        Int      @default(0)
  isActive         Boolean  @default(true)
  hours            OutletHours[]
  rooms            MeetingRoom[]
  site             Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([siteId, slug])
}

model OutletHours {
  id        String  @id @default(cuid())
  outletId  String
  dayOfWeek Int                          // 0 = Minggu … 6 = Sabtu
  openTime  String?                      // "07:00"
  closeTime String?                      // "22:00"
  isClosed  Boolean @default(false)
  outlet    Outlet  @relation(fields: [outletId], references: [id], onDelete: Cascade)
  @@unique([outletId, dayOfWeek])
}

model MenuCategory {
  id        String     @id @default(cuid())
  siteId    String
  name      String                       // Kopi, Non-Kopi, Makanan
  sortOrder Int        @default(0)
  items     MenuItem[]
  site      Site       @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([siteId, name])
}

model MenuItem {
  id          String       @id @default(cuid())
  siteId      String
  categoryId  String
  name        String
  slug        String
  description String       @default("")
  tags        String[]                    // ["Creamy","Sweet"]
  price       Int                         // rupiah, tanpa desimal
  imageId     String?
  isAvailable Boolean      @default(true)
  isFeatured  Boolean      @default(false)
  sortOrder   Int          @default(0)
  updatedAt   DateTime     @updatedAt
  category    MenuCategory @relation(fields: [categoryId], references: [id])
  site        Site         @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([siteId, slug])
  @@index([siteId, categoryId, sortOrder])
}

model Post {                              // Event & Promo / News
  id          String        @id @default(cuid())
  siteId      String
  type        PostType
  title       String
  slug        String
  excerpt     String        @default("")
  body        String                      // Markdown; dirender + disanitasi di website
  coverId     String?
  publishedAt DateTime?
  startsAt    DateTime?                   // periode tayang (opsional)
  endsAt      DateTime?
  status      PublishStatus @default(DRAFT)
  updatedAt   DateTime      @updatedAt
  site        Site          @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([siteId, slug])
  @@index([siteId, status, publishedAt])
}

model HeroSlide {                         // foto hero; SINGLE = 1 baris, SLIDESHOW = banyak baris
  id        String @id @default(cuid())
  siteId    String
  imageId   String
  sortOrder Int    @default(0)
  site      Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@index([siteId, sortOrder])
}

model GalleryItem {                       // hanya dipakai situs dengan hasGallery = true
  id        String @id @default(cuid())
  siteId    String
  imageId   String
  caption   String @default("")
  sortOrder Int    @default(0)
  site      Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
}

model MeetingRoom {
  id          String  @id @default(cuid())
  outletId    String                      // UB Coffee
  name        String                      // "Meeting Room UB Coffee"
  capacity    Int     @default(15)
  minMinutes  Int     @default(60)
  maxMinutes  Int     @default(240)
  bufferMin   Int     @default(30)        // jeda bersih-bersih antar booking
  isActive    Boolean @default(true)
  outlet      Outlet  @relation(fields: [outletId], references: [id])
  bookings    MeetingBooking[]
}

model MeetingBooking {
  id          String        @id @default(cuid())
  code        String        @unique       // MR-1017-7KQ2 (acak, tidak berurutan)
  roomId      String
  name        String
  phone       String                      // E.164
  email       String?
  organization String       @default("")
  purpose     String                      // keperluan
  startAt     DateTime                    // disimpan UTC, ditampilkan Asia/Jakarta
  endAt       DateTime
  pax         Int
  note        String        @default("")
  isInternal  Boolean       @default(false) // blokir jadwal oleh admin
  status      BookingStatus @default(PENDING)
  adminNote   String        @default("")
  handledById String?
  handledAt   DateTime?
  ipHash      String?
  createdAt   DateTime      @default(now())
  room        MeetingRoom   @relation(fields: [roomId], references: [id])
  @@index([roomId, startAt, status])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  siteId    String?
  action    String                        // "menu.update", "reservation.confirm", ...
  entity    String
  entityId  String
  diff      Json?
  createdAt DateTime @default(now())
  @@index([siteId, createdAt])
}
```

Catatan:
- **Anti bentrok jadwal**: tambahkan exclusion constraint PostgreSQL lewat migrasi SQL manual:
  `ALTER TABLE "MeetingBooking" ADD CONSTRAINT no_overlap EXCLUDE USING gist ("roomId" WITH =, tsrange("startAt","endAt") WITH &&) WHERE (status IN ('PENDING','CONFIRMED'));` (butuh `CREATE EXTENSION btree_gist;`). Database sendiri yang menolak double booking.
- **Semua tabel konten punya `siteId`.** Setiap query dashboard wajib difilter `siteId` dari situs aktif yang sudah divalidasi (§10.2).
- Harga disimpan `Int` rupiah. Format `Rp22.000` dibuat saat render.
- `SiteSetting` divalidasi dengan Zod per key, jadi menambah field "Tentang & Kontak" cukup menambah key dan schema tanpa migrasi tabel.

---

## 8. API untuk website publik

Semua endpoint di bawah `/api/public/[site]/…`, **dipanggil dari server website publik** dengan header `Authorization: Bearer <SITE_API_KEY>`. Key di-hash (SHA-256) di DB dan dibandingkan dengan `timingSafeEqual`. Satu key hanya berlaku untuk satu situs.

| Method | Path | Isi |
|---|---|---|
| GET | `/settings` | Semua `SiteSetting` publik (tentang, Instagram, link PDF) |
| GET | `/hero` | Daftar foto hero berurutan (1 foto atau slideshow) |
| GET | `/menu` | Kategori + item aktif, urut |
| GET | `/posts?type=&limit=` | Post `PUBLISHED`, dalam periode tayang |
| GET | `/posts/[slug]` | Detail post |
| GET | `/gallery` | Foto + caption (404 jika situs tidak punya galeri) |
| GET | `/outlets` | Outlet aktif + jam buka |
| GET | `/meeting-room/availability?date=` | Rentang jam yang masih kosong (hanya `ub-coffee`) |
| POST | `/meeting-room/bookings` | Buat booking meeting room (lihat §9, hanya `ub-coffee`) |

Response hanya berisi field publik. Jangan kirim `adminNote`, `ipHash`, data admin, atau draft.

Contoh di website publik:

```ts
// lib/cms.ts (ub-coffee & brewi-jaya) — server only
import 'server-only';

const BASE = process.env.CMS_URL!;
const KEY = process.env.CMS_SITE_KEY!;
const SITE = process.env.CMS_SITE_SLUG!; // "ub-coffee" | "brewi-jaya"

export async function cms<T>(path: string, tags: string[]): Promise<T> {
  const res = await fetch(`${BASE}/api/public/${SITE}${path}`, {
    headers: { Authorization: `Bearer ${KEY}` },
    next: { tags, revalidate: 3600 }, // fallback 1 jam, normalnya on-demand
  });
  if (!res.ok) throw new Error(`CMS ${res.status}`);
  return res.json() as Promise<T>;
}

// pemakaian: const menu = await cms<MenuDTO>('/menu', ['menu']);
```

```ts
// app/api/revalidate/route.ts (website publik)
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

export async function POST(req: Request) {
  const got = Buffer.from(req.headers.get('x-revalidate-secret') ?? '');
  const exp = Buffer.from(process.env.REVALIDATE_SECRET!);
  if (got.length !== exp.length || !timingSafeEqual(got, exp)) {
    return new Response(null, { status: 401 });
  }
  const { tags } = (await req.json()) as { tags: string[] };
  const allowed = new Set(['settings', 'hero', 'menu', 'posts', 'gallery', 'outlets']);
  tags.filter((t) => allowed.has(t)).forEach((t) => revalidateTag(t));
  return Response.json({ ok: true });
}
```

---

## 9. Meeting room UB Coffee

### 9.1 Alur

```
Pengunjung buka website UB Coffee → form "Booking Meeting Room"
  (tanggal, jam mulai, jam selesai, jumlah peserta, nama, WA, instansi, keperluan)
  → pilihan jam hanya menampilkan rentang kosong (GET /availability)
  → Turnstile + validasi di server website (server action)
  → POST ke CMS (validasi ulang + cek bentrok di DB)
  → status PENDING, kode MR dibuat, slot langsung "terkunci sementara"
  → notifikasi ke admin meeting room (email + WA)
  → pengunjung melihat "Booking diterima, menunggu konfirmasi" + kode
Admin: Konfirmasi / Tolak (+alasan) → tamu dapat kabar via WhatsApp
Setelah jadwal lewat: tandai COMPLETED atau NO_SHOW
PENDING yang tidak diproses dalam [24] jam → otomatis kedaluwarsa (cron), slot terbuka lagi
```

### 9.2 Status

```
PENDING ──► CONFIRMED ──► COMPLETED
   │            │    └──► NO_SHOW
   │            └──► CANCELLED
   └──► REJECTED / (kedaluwarsa → CANCELLED)
```

Transisi lain ditolak di server (`features/meeting-room/transitions.ts`).

### 9.3 Aturan validasi (server)

- Tanggal: hari ini sampai maksimal [30] hari ke depan. Mulai minimal [3] jam dari sekarang.
- Jam mulai dan selesai di dalam jam buka UB Coffee hari itu (dari `OutletHours`), kelipatan 30 menit.
- Durasi antara `minMinutes` dan `maxMinutes` ruang. Ditambah `bufferMin` saat cek bentrok.
- `pax` 1 sampai `capacity` (15).
- Tidak bentrok dengan booking PENDING/CONFIRMED lain atau blokir internal. Dijamin oleh exclusion constraint di DB (§7), bukan hanya cek di aplikasi.
- Nomor WA dinormalisasi ke E.164, panjang 10–15 digit.
- `name` ≤ 80, `organization` ≤ 120, `purpose` ≤ 200, `note` ≤ 300 karakter. Ditampilkan sebagai teks (escape otomatis React), tidak pernah sebagai HTML.

```ts
// features/meeting-room/schema.ts
import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/);

export const bookingInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^(\+?62|0)8\d{8,12}$/),
    email: z.string().trim().email().max(120).optional().or(z.literal('')),
    organization: z.string().trim().max(120).default(''),
    purpose: z.string().trim().min(3).max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start: hhmm,
    end: hhmm,
    pax: z.coerce.number().int().min(1).max(15),
    note: z.string().trim().max(300).default(''),
    turnstileToken: z.string().min(1),
  })
  .refine((v) => v.end > v.start, { path: ['end'], message: 'Jam selesai harus setelah jam mulai' });
```

### 9.4 Anti-spam

- Cloudflare Turnstile wajib, diverifikasi di server CMS.
- Rate limit: [3] booking per IP per 10 menit dan [2] booking PENDING aktif per nomor HP. IP disimpan sebagai hash (SHA-256 + salt).
- Honeypot field tersembunyi.

### 9.5 Notifikasi WhatsApp

| Opsi | Cara | Biaya | Rekomendasi |
|---|---|---|---|
| A. Klik-untuk-kirim | Tombol "Kirim WA" di dashboard membuka `wa.me/<nomor>?text=<template>` | Gratis | **Fase 1** |
| B. WhatsApp Cloud API (Meta) | Pesan otomatis saat status berubah | Berbayar, perlu verifikasi bisnis | Fase 2 |

Notifikasi ke admin saat ada booking baru: email (Resend) dari fase 1.

### 9.6 BREWi JAYA

Reservasi BREWi JAYA tetap lewat WhatsApp per outlet. Nomor WA diatur di section **Lokasi & Jam Buka** pada menu Publikasi BREWi JAYA.

---

## 10. Auth, role, dan otorisasi

### 10.1 Role

| Role | Akses |
|---|---|
| SUPER_ADMIN | Ketiga menu + kelola pengguna |
| PUBLISHER | Menu Publikasi untuk situs yang ditugaskan (UB Coffee, BREWi JAYA, atau keduanya) |
| MEETING_ADMIN | Hanya menu Manajemen Meeting Room |

Sidebar hanya menampilkan menu yang boleh diakses user. Akses tetap dicek di server.

### 10.2 Guard di setiap server action dan route

```ts
// lib/guard.ts
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Role } from '@prisma/client';

export class Forbidden extends Error {}

export async function requireSiteAccess(siteSlug: string, roles: Role[]) {
  const session = await auth();
  if (!session?.user) throw new Forbidden();

  const site = await db.site.findUnique({ where: { slug: siteSlug }, select: { id: true } });
  if (!site) throw new Forbidden();

  const m = await db.membership.findFirst({
    where: { userId: session.user.id, OR: [{ siteId: site.id }, { role: 'SUPER_ADMIN' }] },
  });
  if (!m || (m.role !== 'SUPER_ADMIN' && !roles.includes(m.role))) throw new Forbidden();

  return { userId: session.user.id, siteId: site.id, role: m.role };
}
```

Aturan:
- `siteId` **selalu** diambil dari hasil guard, **tidak pernah** dari input form. Ini mencegah IDOR (OWASP A01).
- Action meeting room memakai `requireSiteAccess('ub-coffee', ['MEETING_ADMIN'])`; action publikasi memakai `requireSiteAccess(site, ['PUBLISHER'])`.
- Setiap update/delete memakai `where: { id, siteId }`, bukan `where: { id }` saja.
- Menyembunyikan tombol di UI bukan otorisasi. Pengecekan selalu di server.

### 10.3 Login

- Password di-hash dengan argon2id. Minimal 12 karakter, tolak password yang umum dipakai.
- Rate limit login: 5 percobaan per 15 menit per email + IP. Pesan error tetap generik ("Email atau password salah").
- Cookie session: `HttpOnly`, `Secure`, `SameSite=Lax`, umur 8 jam idle / 7 hari maksimal.
- Opsional fase 2: 2FA TOTP untuk SUPER_ADMIN.

---

## 11. Upload gambar

1. Batas ukuran 500 KB, dicek di server sebelum file dibaca penuh.
2. Deteksi tipe dari **magic bytes** (`file-type`), bukan dari ekstensi atau `Content-Type`. Yang diterima: WebP saja.
3. Re-encode dengan `sharp`: resize maksimal 2400 px sisi panjang, ubah ke WebP kualitas 80, buang metadata EXIF (termasuk lokasi GPS).
4. Nama file baru acak: `sites/{siteId}/{uuid}.webp`.
5. Simpan di object storage, **tidak** di folder aplikasi. Tidak ada eksekusi file.
6. Simpan record `Media` (lebar, tinggi, ukuran) untuk `next/image` (`width`/`height`, mencegah layout shift).
7. SVG ditolak untuk upload admin (bisa berisi script). Logo SVG dimasukkan manual oleh developer.

```ts
// lib/image.ts (inti)
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

const MAX = 5 * 1024 * 1024;
const OK = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function processImage(buf: Buffer) {
  if (buf.byteLength > MAX) throw new Error('FILE_TOO_LARGE');
  const t = await fileTypeFromBuffer(buf);
  if (!t || !OK.has(t.mime)) throw new Error('INVALID_TYPE');
  const img = sharp(buf, { limitInputPixels: 40_000_000 }).rotate();
  const out = await img
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height, bytes: out.info.size };
}
```

---

## 12. Checklist security (OWASP Top 10)

| Risiko | Penanganan |
|---|---|
| A01 Broken Access Control | `requireSiteAccess` di setiap action/route, scope `siteId` dan role per menu, `where` selalu menyertakan `siteId` |
| A02 Cryptographic Failures | HTTPS di semua domain, HSTS, argon2id, API key dan IP di-hash |
| A03 Injection | Prisma (parameterized), Zod di semua input, Markdown disanitasi (`rehype-sanitize`) |
| A04 Insecure Design | State machine booking, exclusion constraint anti-bentrok, rate limit |
| A05 Security Misconfiguration | Security headers (di bawah), error detail hanya di log, `NODE_ENV=production` |
| A06 Vulnerable Components | `npm audit` di CI, Dependabot/Renovate |
| A07 Auth Failures | Rate limit login, session DB yang bisa dicabut, cookie aman |
| A08 Integrity Failures | Lockfile di-commit, revalidate webhook pakai secret |
| A09 Logging & Monitoring | `AuditLog` untuk setiap perubahan, log error (Sentry), alert login gagal berulang |
| A10 SSRF | Tidak ada fetch ke URL dari input user. URL Maps/sosmed hanya disimpan dan divalidasi `https://` |

Lainnya:
- **CSRF**: Server Actions Next.js sudah memeriksa Origin. Route handler yang mengubah data di dashboard wajib memeriksa header `Origin` dan memakai `SameSite=Lax`.
- **Security headers** (`next.config.ts` → `headers()`):
  - `Content-Security-Policy: default-src 'self'; img-src 'self' https://<storage-domain> data:; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` (pakai nonce untuk script inline Next.js)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Dashboard diberi `robots: noindex`.
- Data pribadi pemesan (nama, nomor HP) hanya dapat dilihat MEETING_ADMIN dan SUPER_ADMIN. Data booking lebih dari [12] bulan dihapus atau dianonimkan otomatis (UU PDP).

---

## 13. Environment variables

`cms/.env` (jangan di-commit; isi lewat Vercel/hosting):

```
DATABASE_URL=
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_URL=https://admin.<domain>
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_BASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
MAIL_FROM=
IP_HASH_SALT=
REVALIDATE_SECRET_UB_COFFEE=
REVALIDATE_SECRET_BREWI_JAYA=
```

`ub-coffee/.env` dan `brewi-jaya/.env`:

```
CMS_URL=https://admin.<domain>
CMS_SITE_SLUG=ub-coffee          # atau brewi-jaya
CMS_SITE_KEY=                    # API key situs (plaintext hanya di sini)
REVALIDATE_SECRET=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

---

## 14. Deployment, domain, backup

- **CMS**: Vercel (project baru) di `admin.<domain>`, atau VPS (Docker + Nginx + Let's Encrypt) jika ingin satu server dengan sistem lain.
- **DB**: Neon/Supabase (sudah ada backup dan point-in-time recovery). Jika di VPS: `pg_dump` harian terenkripsi ke storage terpisah, retensi 30 hari, uji restore bulanan.
- **Storage**: bucket privat untuk tulis, publik-baca hanya prefix `sites/`. Aktifkan versioning jika tersedia.
- **Domain**: custom domain untuk kedua website publik dan `admin.`. DNS di Cloudflare, SSL otomatis.
- **Environment**: `preview` (branch) dan `production` dengan database terpisah. Jangan pakai data produksi di preview.
- Jika memakai VPS: SSH key (password login dimatikan), firewall hanya 22/80/443, fail2ban, `unattended-upgrades`, user non-root.

---

## 15. Migrasi data lama

1. Kumpulkan data hardcode dari repo `ub-coffee` dan `brewi-jaya` (array menu, berita, outlet, galeri).
2. `prisma/seed.ts` membaca file itu, mengunggah gambar dari `public/` ke storage lewat `processImage`, lalu membuat record.
3. Cek hasil di dashboard, lalu ganti halaman website publik satu per satu untuk membaca dari CMS.
4. Setelah semua halaman pakai CMS, hapus data hardcode dan gambar konten dari `public/` (aset desain seperti logo tetap).

UB Coffee: menu lengkap saat ini berupa PDF di Google Drive. Bisa tetap jadi link di `SiteSetting` (`menu.pdfUrl`) sementara 28 item diinput ke modul Menu.

---

## 16. Urutan pengerjaan

| # | Milestone | Selesai jika |
|---|---|---|
| 1 | Setup `cms`: Next.js, Prisma, DB, Auth.js, halaman login, layout (sidebar 3 menu, header, page header) | Admin bisa login, menu tampil sesuai role |
| 2 | Guard, audit log, security headers, rate limit login | Test IDOR gagal, header lolos securityheaders.com |
| 3 | Media + `ImageUploader` + `SortableGrid` | Hanya WebP ≤ 500 KB yang diterima, file palsu ditolak |
| 4 | Publikasi › Foto Hero (slideshow & single) + API `/hero` + revalidate | Tambah/urutkan foto slideshow UB Coffee → website berubah tanpa redeploy |
| 5 | Publikasi › Tentang & Kontak + API `/settings` | Tagline UB Coffee dan paragraf BREWi JAYA bisa diubah |
| 6 | Publikasi › Lokasi & Jam Buka + API `/outlets` | Section lokasi kedua website membaca dari CMS |
| 7 | Publikasi › Menu + API `/menu` + seed menu lama | Toggle "Tersedia" langsung tercermin di website |
| 8 | Publikasi › Event & Promo + API `/posts` + halaman detail | Post terjadwal tayang otomatis |
| 9 | Publikasi › Galeri (BREWi JAYA) + API `/gallery` | |
| 10 | Meeting Room: model + exclusion constraint + API availability/bookings + form di website UB Coffee | Booking masuk ke dashboard, bentrok jadwal ditolak DB |
| 11 | Meeting Room: daftar booking, kalender harian, konfirmasi/tolak, blokir jadwal, kedaluwarsa otomatis, notifikasi | Pemesan menerima kabar status |
| 12 | Hardening & go-live: backup, monitoring, uji restore, panduan admin | Checklist §12 lengkap |

Setiap milestone dikerjakan tuntas (DB → server action/API → UI dashboard → website publik) sebelum lanjut.

---

## 17. Pertanyaan untuk owner (sebelum milestone 10)

1. Durasi minimal dan maksimal satu booking meeting room? Perlu jeda antar booking?
2. Pemesanan paling cepat berapa jam sebelumnya, dan paling jauh berapa hari ke depan?
3. Ada biaya sewa, minimum order, atau DP? (Jika ada pembayaran online, itu fase terpisah.)
4. Fasilitas yang bisa dipilih (proyektor, sound, konsumsi)?
5. Siapa yang mengonfirmasi booking, dan nomor WA mana yang menerima notifikasi?
6. Booking PENDING dibiarkan berapa lama sebelum otomatis batal?
7. Notifikasi ke tamu cukup klik-kirim WA (gratis), atau WhatsApp otomatis (berbayar)?
8. Domain final dan hosting (Vercel atau server PT Brawijaya Multi Usaha)?
