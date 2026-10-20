/**
 * Data contoh untuk dashboard selama CMS belum terhubung ke database.
 * Isi diambil dari konten website UB Coffee & BREWi JAYA saat ini.
 * Saat milestone DB selesai, file ini diganti oleh query Prisma (features/*).
 */
import { addDays } from "./format";
import type { Booking, DayHours, MeetingRoomInfo, MenuItem, Outlet, Photo, Post, PostTag, SiteContent, SiteSlug } from "./types";

const hero = (file: string, alt: string): Photo => ({ id: `hero_${file}`, src: `/hero/${file}.webp`, hue: 30, alt });
const menuPhoto = (id: string, alt: string): Photo => ({ id: `mp_${id}`, src: `/menu/${id}.webp`, hue: 30, alt });
const placeholder = (id: string, hue: number, alt: string): Photo => ({ id, src: null, hue, alt });

const hours = (rows: Array<[string, string] | null>): DayHours[] =>
  rows.map((r) => (r ? { open: r[0], close: r[1], closed: false } : { open: "", close: "", closed: true }));

const every = (open: string, close: string) => hours(Array.from({ length: 7 }, () => [open, close]));

function ubCoffee(today: string): SiteContent {
  const menu: MenuItem[] = [
    ["hot-cappucino", "Hot Cappucino", "Kopi", 25000, "Espresso, susu steamed, dan foam lembut dengan latte art khas UB Coffee."],
    ["ice-ub-coffee", "Ice UB Coffee", "Kopi", 22000, "Kopi susu dingin khas UB Coffee dengan espresso, susu segar, dan es batu."],
    ["milkshake-vanilla", "Milkshake Vanilla", "Non-Kopi", 28000, "Milkshake vanila dengan whipped cream, saus karamel, remahan biskuit, dan wafer roll."],
    ["ubee-breakfast", "Ubee Breakfast", "Makanan", 30000, "Sarapan lengkap dengan telur orak-arik, sosis panggang, kentang panggang, dan saus."],
    ["nasi-goreng-kampung", "Nasi Goreng Kampung", "Makanan", 40000, "Nasi goreng rempah Nusantara dengan ayam dan sayuran, disajikan bersama acar, kerupuk, ikan asin, dan telur."],
    ["chicken-rice-steak", "Chicken Rice Steak", "Makanan", 38000, "Ayam panggang dengan nasi hangat, sayuran campur, dan saus steak."],
    ["nusantara-fries", "Nusantara Fries", "Makanan", 37000, "Tempe mendoan, pisang goreng, tahu sutra, menjes, dan tape goreng dengan saus petis."],
    ["cookie-bomb", "Cookie Bomb", "Makanan", 35000, "Cookie cokelat tebal yang lembut di dalam, dengan whipped cream dan daun mint."],
  ].map(([id, name, category, price, description], i) => ({
    id: `ub_m${i}`,
    name: name as string,
    category: category as MenuItem["category"],
    price: price as number,
    description: description as string,
    tags: [],
    photo: menuPhoto(id as string, name as string),
    isAvailable: true,
    isFeatured: i < 2,
  }));
  menu.push({
    id: "ub_m8",
    name: "Matcha Latte",
    category: "Non-Kopi",
    price: 27000,
    description: "Matcha Jepang dengan susu segar, disajikan dingin.",
    tags: [],
    photo: null,
    isAvailable: false,
    isFeatured: false,
  });

  // Tag awal; id & slug sama dengan kategori berita di landing page (event, kolaborasi, tips, cerita).
  const postTags: PostTag[] = [
    { id: "cat-event", slug: "event", label: "Event", type: "BERITA" },
    { id: "cat-promo", slug: "promo", label: "Promo", type: "BERITA" },
    { id: "cat-info", slug: "info", label: "Info", type: "BERITA" },
    { id: "cat-kolaborasi", slug: "kolaborasi", label: "Kolaborasi", type: "BERITA" },
    { id: "cat-tips", slug: "tips", label: "Tips Kopi", type: "ARTIKEL" },
    { id: "cat-cerita", slug: "cerita", label: "Cerita", type: "ARTIKEL" },
  ];

  const posts: Post[] = [
    {
      id: "ub_p1",
      type: "BERITA",
      tags: ["cat-event"],
      title: "Live Akustik Jumat Malam",
      slug: "live-akustik-jumat-malam",
      excerpt: "Tutup minggu dengan musik akustik dari musisi kampus. Mulai pukul 19.00, gratis untuk semua pengunjung.",
      body: "Tutup minggu dengan musik akustik dari musisi kampus.\n\n- Mulai pukul **19.00**\n- Gratis untuk semua pengunjung",
      cover: hero("DSC01881", "Pengunjung bekerja di kafe"),
      publishedAt: addDays(today, -3),
      startsAt: "",
      endsAt: "",
      status: "PUBLISHED",
    },
    {
      id: "ub_p2",
      type: "BERITA",
      tags: ["cat-promo"],
      title: "Diskon 15% Civitas UB",
      slug: "diskon-15-civitas-ub",
      excerpt: "Tunjukkan kartu identitas UB untuk potongan 15% semua minuman, Senin – Kamis.",
      body: "Tunjukkan kartu identitas UB untuk potongan **15%** semua minuman, Senin – Kamis.",
      cover: hero("Iced_UB_Coffee_11", "Iced UB Coffee"),
      publishedAt: addDays(today, -11),
      startsAt: "",
      endsAt: "",
      status: "PUBLISHED",
    },
    {
      id: "ub_p3",
      type: "BERITA",
      tags: ["cat-event"],
      title: "Kelas Seduh Manual",
      slug: "kelas-seduh-manual",
      excerpt: "Belajar dasar V60 bersama barista UB Coffee. Kuota 12 orang.",
      body: "Belajar dasar V60 bersama barista UB Coffee. Kuota **12 orang**.",
      cover: hero("DSCF0523", "Barista menyeduh kopi"),
      publishedAt: addDays(today, 6),
      startsAt: "",
      endsAt: "",
      status: "PUBLISHED",
    },
    {
      id: "ub_p5",
      type: "BERITA",
      tags: ["cat-info"],
      title: "Jam Buka Libur Nasional",
      slug: "jam-buka-libur-nasional",
      excerpt: "Saat libur nasional, UB Coffee buka pukul 12.00 – 20.00.",
      body: "",
      cover: hero("DSC01991", "Tampak depan UB Coffee"),
      publishedAt: addDays(today, -18),
      startsAt: "",
      endsAt: "",
      status: "PUBLISHED",
    },
    {
      id: "ub_p4",
      type: "BERITA",
      tags: ["cat-info"],
      title: "Matcha Latte Segera Hadir",
      slug: "matcha-latte-segera-hadir",
      excerpt: "Menu baru untuk pencinta teh hijau.",
      body: "",
      cover: null,
      publishedAt: addDays(today, 10),
      startsAt: "",
      endsAt: "",
      status: "DRAFT",
    },
  ];

  const outlets: Outlet[] = [
    {
      id: "ub_o1",
      name: "UB Coffee",
      address: "Jl. MT. Haryono No.169, Ketawanggede, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145",
      landmark: "Tepi Jl. MT. Haryono, dekat gerbang masuk KPRI UB",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=UB%20Coffee%20Malang",
      whatsapp: "6282132245897",
      isActive: true,
      hours: hours([
        ["07:00", "22:00"],
        ["07:00", "22:00"],
        ["07:00", "22:00"],
        ["07:00", "22:00"],
        ["07:00", "22:00"],
        ["09:00", "22:00"],
        ["07:00", "22:00"],
      ]),
    },
    {
      id: "ub_o2",
      name: "Gazebo Corner by UB Coffee",
      address: "Jl. Universitas Brawijaya, Ketawanggede, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145",
      landmark: "Berlokasi di Gazebo Raden Wijaya Universitas Brawijaya",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=2JV7%2BJ3X%20Malang",
      whatsapp: "6282132245897",
      isActive: true,
      hours: hours([
        ["08:00", "18:00"],
        ["08:00", "18:00"],
        ["08:00", "18:00"],
        ["08:00", "18:00"],
        ["08:00", "18:00"],
        ["08:00", "18:00"],
        null,
      ]),
    },
  ];

  const meetingRoom: MeetingRoomInfo = {
    description:
      "Cari ruang meeting yang nyaman, fasilitas lengkap, dan suasana inspiratif? Meeting Room UB Coffee siap mendukung kesuksesan setiap acara Anda! Dengan kapasitas hingga 15 orang, ruangan kami adalah pilihan tepat untuk pertemuan bisnis, pelatihan, hingga workshop eksklusif.",
    capacity: 15,
    rentalPrices: [
      { id: "ub_r1", label: "Internal UB", price: 100000 },
      { id: "ub_r2", label: "Eksternal", price: 150000 },
    ],
    facilities: ["Air mineral 600ml per orang", "LCD proyektor", "Set audio"],
    photos: [
      hero("DFTA0048", "Meeting room UB Coffee dengan layar proyektor"),
      hero("DFTA0081", "Ruang meeting dengan meja coffee break dan sofa"),
      hero("DFTA0045", "Ruangan kaca semi outdoor UB Coffee"),
      hero("DFTA0069", "Sajian coffee break untuk meeting"),
      hero("DSC02120", "Meja panjang di area indoor"),
      hero("DFTA0041", "Ruangan kaca menghadap taman"),
      hero("DSC02111", "Area duduk indoor UB Coffee"),
    ].map((p) => ({ ...p, id: p.id.replace("hero_", "mr_") })),
    packagesNote: "Seluruh paket sudah termasuk biaya sewa ruangan dan air mineral gratis untuk minimal 10 orang.",
    packages: [
      {
        id: "ub_k1",
        name: "Mini Coffee Break & 2 Snack",
        description: "Cocok untuk pertemuan dengan santai dan ngemil ringan.",
        price: 400000,
        minPax: 10,
        extraPerPax: 40000,
      },
      {
        id: "ub_k2",
        name: "Mini Coffee Break & 3 Snack",
        description: "Pilihan ekstra snack untuk memenuhi selera peserta meeting Anda.",
        price: 450000,
        minPax: 10,
        extraPerPax: 45000,
      },
      {
        id: "ub_k3",
        name: "Mini Coffee Break Only",
        description: "Pilihan praktis bagi Anda yang hanya ingin menikmati kopi berkualitas selama meeting.",
        price: 250000,
        minPax: 10,
        extraPerPax: 25000,
      },
    ],
    snackInfo:
      "Kami menyediakan berbagai pilihan snack tradisional yang lezat, mulai dari donat manis, lapis, dadar gulung, hingga pizza mini. Semua bisa disesuaikan dengan selera peserta meeting Anda untuk pengalaman yang lebih personal.",
    orderingNote:
      "Untuk memastikan ketersediaan dan kualitas terbaik, pemesanan paket dengan snack harus dikonfirmasi maksimal H-1 sebelum acara.",
  };

  return {
    hero: [
      hero("DSC01991", "Tampak depan UB Coffee"),
      hero("DSC01690-2", "Pelayan mencatat pesanan"),
      hero("DFTA0020", "Meja bernomor di area indoor"),
      hero("DSC02083", "Koki memasak di dapur"),
      hero("3", "Sudut meja kafe"),
      hero("DFTA0029", "Gazebo beratap genteng"),
      hero("DSC01881", "Pengunjung bekerja di kafe"),
      hero("DFTA0071", "Teko dan cangkir di meja saji"),
      hero("DSC01993", "Bangunan bata UB Coffee"),
      hero("DSC02019", "Pengunjung berbincang di meja"),
      hero("DFTA0001", "Kursi di area taman"),
      hero("DSC02120", "Meja panjang di area indoor"),
      hero("DSCF0517", "Ruang kaca dilihat dari luar"),
      hero("DFTA0067", "Bangunan UB Coffee dari halaman"),
      hero("DSCF0391", "Pengunjung di area dalam"),
      hero("DFTA0045", "Area semi outdoor"),
      hero("DSC01965", "Papan nama UB Coffee di tepi jalan"),
    ],
    settings: {
      about: "Mampir, duduk, nikmati.",
      instagram: "@ub_coffee",
      menuPdfUrl: "https://drive.google.com/file/d/12NkYto4KrPpZlWOe-BfJy7LZF3TuHb1F/view",
    },
    menu,
    posts,
    postTags,
    gallery: [],
    outlets,
    meetingRoom,
  };
}

function brewiJaya(today: string): SiteContent {
  const items: Array<[string, MenuItem["category"], number, string[], boolean]> = [
    ["Kopi Susu Brewi", "Kopi", 22000, ["Creamy", "Sweet"], true],
    ["Lemon Cream Coffee", "Kopi", 28000, ["Bold", "Citrus"], true],
    ["Kopi Aren Latte", "Kopi", 25000, ["Creamy", "Lokal"], true],
    ["Iced Caramel Latte", "Kopi", 27000, ["Sweet", "Creamy"], true],
    ["Susu Kacang Hijau", "Non-Kopi", 20000, ["Creamy", "Lokal"], true],
    ["Strawberry Milk", "Non-Kopi", 24000, ["Fruity", "Sweet"], false],
    ["Pandan Aren Milk", "Non-Kopi", 23000, ["Sweet", "Lokal"], true],
    ["Croissant Butter", "Makanan", 22000, [], true],
    ["Nasi Goreng Brewi", "Makanan", 32000, [], true],
    ["Roti Bakar Cokelat", "Makanan", 20000, [], true],
    ["Kentang Goreng", "Makanan", 18000, [], true],
    ["Mie Nyemek", "Makanan", 26000, [], true],
    ["Pisang Goreng Keju", "Makanan", 19000, [], true],
  ];
  const menu: MenuItem[] = items.map(([name, category, price, tags, isAvailable], i) => ({
    id: `bj_m${i}`,
    name,
    category,
    price,
    description: "",
    tags,
    photo: null,
    isAvailable,
    isFeatured: i === 0,
  }));

  const captions = [
    "Area indoor",
    "Barista menyiapkan espresso",
    "Espresso segar dari bar",
    "Pelayanan ramah",
    "Shot espresso di atas susu",
    "Detail kecil yang hangat",
    "Mesin espresso & grinder",
    "Area outdoor",
    "Di balik bar",
    "Barista & ruang dalam",
    "Rooftop dengan pemandangan",
    "Peresmian BREWi JAYA",
    "Ngobrol lama di meja panjang",
    "Pemandangan sawah & kereta lewat",
    "Tampak depan BREWi JAYA",
  ];

  const outlet = (i: number, name: string, address: string, h: DayHours[]): Outlet => ({
    id: `bj_o${i}`,
    name,
    address,
    landmark: "",
    mapsUrl: "",
    whatsapp: `628123456789${i}`,
    isActive: true,
    hours: h,
  });

  return {
    hero: [placeholder("bj_hero", 150, "Suasana BREWi JAYA")],
    settings: {
      about:
        "BREWi JAYA adalah rumah untuk kopi lokal pilihan yang diseduh barista kami, hidangan rumahan, dan ruang yang hangat. Datang untuk kerja, ngobrol bareng teman, atau sekadar melepas penat. Sekali mampir, biasanya betah lama-lama.",
      instagram: "@brewijaya",
      menuPdfUrl: "",
    },
    menu,
    postTags: [],
    posts: [
      {
        id: "bj_p1",
        type: "MENU_BARU",
        title: "Iced Caramel Latte Resmi Hadir di Brewi",
        slug: "iced-caramel-latte-resmi-hadir",
        excerpt: "Perpaduan espresso, susu, dan karamel yang manis dan segar.",
        body: "Perpaduan espresso, susu, dan karamel.",
        cover: placeholder("bj_c1", 25, "Iced Caramel Latte"),
        publishedAt: addDays(today, -22),
        startsAt: "",
        endsAt: "",
        status: "PUBLISHED",
        tags: [],
      },
      {
        id: "bj_p2",
        type: "PROMO",
        title: "Beli 2 Kopi Susu Brewi, Hemat Rp 8.000",
        slug: "beli-2-kopi-susu-brewi",
        excerpt: "Berlaku di semua outlet BREWi JAYA.",
        body: "Berlaku di semua outlet BREWi JAYA.",
        cover: placeholder("bj_c2", 200, "Promo Kopi Susu Brewi"),
        publishedAt: addDays(today, -27),
        startsAt: addDays(today, -27),
        endsAt: addDays(today, 3),
        status: "PUBLISHED",
        tags: [],
      },
      {
        id: "bj_p3",
        type: "EVENT",
        title: "Live Acoustic Setiap Sabtu Malam",
        slug: "live-acoustic-setiap-sabtu-malam",
        excerpt: "Musik akustik setiap Sabtu mulai pukul 19.00.",
        body: "Musik akustik setiap Sabtu mulai pukul 19.00.",
        cover: placeholder("bj_c3", 280, "Live Acoustic"),
        publishedAt: addDays(today, -32),
        startsAt: "",
        endsAt: "",
        status: "PUBLISHED",
        tags: [],
      },
    ],
    gallery: captions.map((caption, i) => ({
      id: `bj_g${i}`,
      caption,
      photo: placeholder(`bj_gp${i}`, (i * 37) % 360, caption),
    })),
    outlets: [
      outlet(0, "BREWi JAYA Transmart", "Transmart, Jl. Veteran, Ketawanggede, Kec. Klojen, Kota Malang", every("09:00", "22:00")),
      outlet(1, "BREWi JAYA Express FIB", "Fakultas Ilmu Budaya, Universitas Brawijaya, Kota Malang", every("07:00", "17:00")),
      outlet(2, "BREWi JAYA Rest Area KM 66 A", "Rest Area KM 66 A", every("00:00", "23:30")),
      outlet(3, "BREWi JAYA IKN", "Ibu Kota Nusantara, Kalimantan Timur", every("08:00", "21:00")),
      outlet(4, "BREWi JAYA Jagorawi", "Rest Area Tol Jagorawi", every("06:00", "22:00")),
    ],
    meetingRoom: null,
  };
}

export function mockContent(today: string): Record<SiteSlug, SiteContent> {
  return { "ub-coffee": ubCoffee(today), "brewi-jaya": brewiJaya(today) };
}

export function mockBookings(today: string): Booking[] {
  const created = (daysAgo: number, time = "08:15") => `${addDays(today, -daysAgo)}T${time}:00+07:00`;
  const b = (
    id: string,
    code: string,
    name: string,
    phone: string,
    organization: string,
    purpose: string,
    dayOffset: number,
    start: string,
    end: string,
    pax: number,
    status: Booking["status"],
    extra: Partial<Booking> = {},
  ): Booking => {
    const createdAt = created(Math.max(1, 2 - Math.min(dayOffset, 0)));
    const history: Booking["history"] = [{ at: createdAt, label: "Booking masuk dari website", by: "Website UB Coffee" }];
    const adminAt = `${addDays(today, Math.min(dayOffset, 0) - 1)}T10:20:00+07:00`;
    if (status === "CONFIRMED" || status === "COMPLETED" || status === "NO_SHOW" || status === "CANCELLED")
      history.push({ at: adminAt, label: "Dikonfirmasi", by: "Admin UB Coffee" });
    if (status === "REJECTED")
      history.push({ at: adminAt, label: "Ditolak", by: "Admin UB Coffee", note: extra.adminNote });
    if (status === "CANCELLED")
      history.push({ at: adminAt, label: "Dibatalkan", by: "Admin UB Coffee", note: extra.adminNote });
    if (status === "COMPLETED") history.push({ at: adminAt, label: "Ditandai selesai", by: "Admin UB Coffee" });
    if (status === "NO_SHOW") history.push({ at: adminAt, label: "Ditandai tidak hadir", by: "Admin UB Coffee" });
    return {
      id,
      code,
      name,
      phone,
      email: "",
      organization,
      purpose,
      date: addDays(today, dayOffset),
      start,
      end,
      pax,
      note: "",
      isInternal: false,
      roomId: "arjuna",
      source: "WEBSITE",
      status,
      adminNote: "",
      createdAt,
      history,
      ...extra,
    };
  };

  const list: Booking[] = [
    b("bk1", "MR-0000-7KQ2", "Rina A.", "6281234561021", "PT Sinar Malang", "Rapat divisi pemasaran", 5, "09:00", "11:00", 12, "PENDING", {
      email: "rina@sinarmalang.co.id",
      note: "Butuh proyektor dan colokan tambahan.",
    }),
    b("bk2", "MR-0000-P3XD", "Bagas Pratama", "6285711223344", "BEM FILKOM UB", "Rapat koordinasi panitia dies natalis", 0, "13:00", "15:00", 10, "PENDING", {
      roomId: "semeru",
    }),
    b("bk3", "MR-0000-H8MV", "Dewi Lestari", "6281398765432", "", "Wawancara kerja tim kecil", 1, "10:00", "12:00", 4, "PENDING", { roomId: "semeru" }),
    b("bk4", "MR-0000-Z2RT", "Himpunan Mahasiswa Akuntansi", "6282245678901", "FEB UB", "Diskusi program kerja", 0, "08:00", "10:00", 14, "CONFIRMED"),
    b("bk5", "MR-0000-C6WN", "Andi Wijaya", "6281122334455", "Kantor Notaris Andi", "Penandatanganan kontrak", 2, "15:00", "16:30", 6, "CONFIRMED"),
    b("bk6", "MR-0000-K9BF", "Lab Riset Data", "6287766554433", "FMIPA UB", "Workshop internal analisis data", 3, "09:00", "13:00", 15, "CONFIRMED", {
      // Contoh reservasi langsung (telepon) yang diinput admin.
      roomId: "open-space",
      source: "ADMIN",
      history: [{ at: created(2), label: "Booking diinput admin (langsung dikonfirmasi)", by: "Admin UB Coffee" }],
    }),
    b("bk12", "MR-0000-D4OS", "Komunitas Desain Malang", "6281234500055", "", "Meetup bulanan", 0, "10:00", "13:00", 24, "CONFIRMED", {
      roomId: "open-space",
    }),
    b("bk7", "MR-0000-T4JS", "Yusuf H.", "6281234500011", "", "Arisan keluarga", -1, "16:00", "18:00", 12, "COMPLETED"),
    b("bk8", "MR-0000-Q7LA", "Mega S.", "6281234500022", "Startup Kopi Kita", "Pitching investor", -2, "10:00", "11:00", 5, "NO_SHOW"),
    b("bk9", "MR-0000-E5GU", "Fajar N.", "6281234500033", "", "Nonton bareng", 1, "19:00", "22:00", 15, "REJECTED", {
      adminNote: "Kegiatan nonton bareng tidak bisa di meeting room (kebisingan).",
    }),
    b("bk10", "MR-0000-W3YP", "Lina K.", "6281234500044", "Komunitas Buku Malang", "Diskusi buku bulanan", 4, "14:00", "16:00", 9, "CANCELLED", {
      adminNote: "Dibatalkan pemesan lewat WhatsApp.",
    }),
    {
      id: "bk11",
      code: "MR-0000-INT1",
      name: "Perawatan AC",
      phone: "",
      email: "",
      organization: "Internal UB Coffee",
      purpose: "Servis AC rutin",
      date: today,
      start: "18:00",
      end: "20:00",
      pax: 0,
      note: "",
      isInternal: true,
      roomId: "arjuna",
      source: "ADMIN",
      status: "CONFIRMED",
      adminNote: "",
      createdAt: created(3),
      history: [{ at: created(3), label: "Jadwal diblokir", by: "Admin UB Coffee" }],
    },
  ];
  return list.map((x) => ({ ...x, code: x.isInternal ? x.code : x.code.replace("0000", x.date.slice(5, 7) + x.date.slice(8, 10)) }));
}
