/** SUPER_ADMIN: semua menu. SITE_ADMIN: hanya situs di `sites` (admin UB Coffee juga memegang Meeting Room). */
export type Role = "SUPER_ADMIN" | "SITE_ADMIN";
export type SiteSlug = "ub-coffee" | "brewi-jaya";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Situs yang boleh dikelola SITE_ADMIN. SUPER_ADMIN otomatis semua situs. */
  sites: SiteSlug[];
};

/** Tempat yang bisa dibooking di UB Coffee (id sama dengan landing page). Daftar & kapasitas: ROOMS di lib/booking.ts. */
export type RoomId = "arjuna" | "semeru" | "open-space";

export type Room = {
  id: RoomId;
  name: string;
  kind: "Ruang meeting" | "Open space";
  /** Orang. Kosong = tanpa batas kapasitas (Open Space). */
  capacity?: number;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type BookingHistory = {
  at: string; // ISO timestamp
  label: string;
  by: string;
  note?: string;
};

export type Booking = {
  id: string;
  code: string;
  name: string;
  phone: string; // E.164 tanpa "+", mis. 6281234561021
  email: string;
  organization: string;
  purpose: string;
  date: string; // YYYY-MM-DD (Asia/Jakarta)
  start: string; // HH:MM
  end: string; // HH:MM
  pax: number;
  note: string;
  /** true = blokir jadwal internal (bukan booking pemesan). */
  isInternal: boolean;
  roomId: RoomId;
  /** WEBSITE = dari form website; ADMIN = reservasi langsung yang diinput admin. */
  source: "WEBSITE" | "ADMIN";
  status: BookingStatus;
  adminNote: string;
  createdAt: string;
  history: BookingHistory[];
};

/** Isi form "Booking jadwal" (reservasi langsung yang diinput admin). */
export type ManualBookingInput = {
  roomId: RoomId;
  name: string;
  phone: string; // E.164 tanpa "+", atau "" jika tidak diisi
  organization: string;
  purpose: string;
  date: string;
  start: string;
  end: string;
  pax: number;
  note: string;
};

/** Nada warna label status (StatusChip). */
export type Tone = "warn" | "ok" | "mute" | "info" | "danger";

/** Foto. `src` null = belum ada file (ditampilkan sebagai placeholder berwarna). */
export type Photo = {
  id: string;
  src: string | null;
  hue: number;
  alt: string;
};

export type MenuCategory = "Kopi" | "Non-Kopi" | "Makanan";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  tags: string[];
  photo: Photo | null;
  isAvailable: boolean;
  isFeatured: boolean;
};

/** UB Coffee: BERITA & ARTIKEL (tetap, tidak bisa ditambah admin). BREWi JAYA: EVENT, PROMO, MENU_BARU. */
export type PostType = "BERITA" | "ARTIKEL" | "EVENT" | "PROMO" | "MENU_BARU";
export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type Post = {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover: Photo | null;
  publishedAt: string; // YYYY-MM-DD
  startsAt: string; // YYYY-MM-DD atau ""
  endsAt: string;
  status: PublishStatus;
  /** id `PostTag` (maks. 3, jenisnya sama dengan `type`). Kosong untuk situs tanpa tag. API mengirim slug-nya. */
  tags: string[];
  /** Pengaturan SEO halaman detail; kosong = website memakai judul & ringkasan. */
  seo?: PostSeo;
};

/** Tag publikasi. Data per situs: admin bisa menambah tag. Setiap tag terikat pada satu jenis post. */
export type PostTag = {
  id: string;
  /** Unik per situs; dipakai filter tag di website. */
  slug: string;
  label: string;
  type: PostType;
};

export type PostSeo = {
  metaTitle: string;
  metaDescription: string;
  tags: string[];
};

export type GalleryItem = { id: string; photo: Photo; caption: string };

export type DayHours = { open: string; close: string; closed: boolean };

export type Outlet = {
  id: string;
  name: string;
  address: string;
  /** Patokan singkat di bawah alamat, mis. "Dekat gerbang masuk KPRI UB". */
  landmark: string;
  mapsUrl: string;
  whatsapp: string; // E.164 tanpa "+"
  isActive: boolean;
  /** index 0 = Senin … 6 = Minggu */
  hours: DayHours[];
};

export type SiteSettings = {
  about: string;
  instagram: string;
  menuPdfUrl: string;
};

export type RentalPrice = { id: string; label: string; price: number };

export type MeetingPackage = {
  id: string;
  name: string;
  description: string;
  /** Harga paket untuk `minPax` orang (rupiah). */
  price: number;
  minPax: number;
  /** Tambahan per orang di atas `minPax` (rupiah). */
  extraPerPax: number;
};

/** Isi tab "Reservasi" website UB Coffee (informasi meeting room). Booking-nya dikelola di menu Meeting Room. */
export type MeetingRoomInfo = {
  description: string;
  capacity: number;
  rentalPrices: RentalPrice[];
  facilities: string[];
  photos: Photo[];
  packagesNote: string;
  packages: MeetingPackage[];
  snackInfo: string;
  orderingNote: string;
};

export type SiteContent = {
  hero: Photo[];
  settings: SiteSettings;
  menu: MenuItem[];
  posts: Post[];
  /** Kosong untuk situs tanpa tag (`SiteConfig.hasPostTags = false`). */
  postTags: PostTag[];
  gallery: GalleryItem[];
  outlets: Outlet[];
  /** null = situs tidak punya tab Reservasi meeting room. */
  meetingRoom: MeetingRoomInfo | null;
};

/** Section halaman Publikasi; urutannya mengikuti susunan website masing-masing. */
export type SectionKey = "hero" | "tentang" | "menu" | "reservasi" | "lokasi" | "event" | "galeri";

export type SiteConfig = {
  slug: SiteSlug;
  name: string;
  url: string;
  heroMode: "SINGLE" | "SLIDESHOW";
  /** Urutan section di dashboard = urutan di website. Section yang tidak ada di sini tidak ditampilkan. */
  sections: SectionKey[];
  hasGallery: boolean;
  /** CAROUSEL: website menampilkan menu satu per satu tanpa harga (UB Coffee). LIST: daftar dengan harga. */
  menuStyle: "CAROUSEL" | "LIST";
  /** Tipe post yang dipakai website ini. */
  postTypes: PostType[];
  /** true = post wajib punya 1–3 tag (`SiteContent.postTags`), dan admin bisa menambah tag. */
  hasPostTags: boolean;
  /** true = post punya halaman detail (slug + isi). false = hanya kartu ringkas. */
  hasPostDetail: boolean;
  hasMenuPdf: boolean;
  hasTasteTags: boolean;
  aboutTarget: string;
  instagramTarget: string;
};
