"use client";

/**
 * Hook data per entitas: satu-satunya jalan komponen membaca dan mengubah data.
 * Memanggil lib/repo, memperbarui cache di store dengan hasilnya, dan menampilkan toast lewat run().
 */
import { canTransition } from "@/lib/booking";
import * as repo from "@/lib/repo";
import type {
  Booking,
  BookingStatus,
  GalleryItem,
  ManualBookingInput,
  MeetingPackage,
  MenuItem,
  Outlet,
  Photo,
  Post,
  PostTag,
  PostType,
  SiteContent,
  SiteSettings,
  SiteSlug,
} from "@/lib/types";
import { useStore } from "./store";

const STALE_MESSAGE = "Status booking sudah berubah. Muat ulang halaman.";

type WithId = { id: string };

const exists = <T extends WithId>(items: T[], id: string) => items.some((x) => x.id === id);
const upsert = <T extends WithId>(items: T[], item: T) =>
  exists(items, item.id) ? items.map((x) => (x.id === item.id ? item : x)) : [...items, item];
const without = <T extends WithId>(items: T[], id: string) => items.filter((x) => x.id !== id);
const ids = (items: WithId[]) => items.map((x) => x.id);

export function useBookings() {
  const { bookings, setBookingsCache: setBookings, run, toast, user } = useStore();
  const by = user.name;

  const replace = (b: Booking) => setBookings((all) => all.map((x) => (x.id === b.id ? b : x)));

  /** Transisi tidak sah ditolak seketika di klien; repo memeriksanya lagi. */
  function transition(id: string, to: BookingStatus, call: () => Promise<Booking>) {
    const b = bookings.find((x) => x.id === id);
    if (!b || !canTransition(b.status, to)) {
      toast(STALE_MESSAGE, "error");
      return Promise.resolve(false);
    }
    return run(async () => replace(await call()));
  }

  return {
    bookings,
    confirm: (id: string, note: string) => transition(id, "CONFIRMED", () => repo.confirmBooking(id, note, by)),
    reject: (id: string, reason: string) => transition(id, "REJECTED", () => repo.rejectBooking(id, reason, by)),
    cancel: (id: string, reason: string) => transition(id, "CANCELLED", () => repo.cancelBooking(id, reason, by)),
    mark: (id: string, to: "COMPLETED" | "NO_SHOW") => transition(id, to, () => repo.markBooking(id, to, by)),
    createManual: (input: ManualBookingInput) =>
      run(async () => {
        const b = await repo.createManualBooking(input, by);
        setBookings((all) => [...all, b]);
      }, `Booking ${input.name} disimpan dan dikonfirmasi.`),
  };
}

/** Konten satu situs dari cache + cara memperbaruinya dengan hasil repo. */
function useSite(site: SiteSlug) {
  const { content, run, setSiteCache } = useStore();
  const setCache = (fn: (c: SiteContent) => SiteContent) => setSiteCache(site, fn);
  return { c: content[site], run, setCache };
}

export function useHero(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  const set = (hero: Photo[]) => setCache((x) => ({ ...x, hero }));
  return {
    photos: c.hero,
    add: (photos: Photo[]) => run(async () => set(await repo.addHeroPhotos(site, photos))),
    reorder: (next: Photo[]) =>
      run(async () => set(await repo.reorderHero(site, ids(next))), "Urutan foto disimpan. Website diperbarui."),
    remove: (id: string) => run(async () => set(await repo.removeHeroPhoto(site, id))),
  };
}

export function useSettings(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  return {
    settings: c.settings,
    update: (patch: Partial<SiteSettings>) =>
      run(async () => {
        const settings = await repo.updateSettings(site, patch);
        setCache((x) => ({ ...x, settings }));
      }),
  };
}

export function useMenu(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  const setMenu = (fn: (m: MenuItem[]) => MenuItem[]) => setCache((x) => ({ ...x, menu: fn(x.menu) }));
  return {
    items: c.menu,
    /** Item baru (id belum ada) dibuat, yang lama diperbarui. */
    save: (item: MenuItem) =>
      run(async () => {
        const saved = exists(c.menu, item.id) ? await repo.updateMenuItem(site, item) : await repo.createMenuItem(site, item);
        setMenu((all) => upsert(all, saved));
      }),
    setAvailable: (item: MenuItem, available: boolean) =>
      run(
        async () => {
          const saved = await repo.setMenuAvailable(site, item.id, available);
          setMenu((all) => upsert(all, saved));
        },
        `${item.name} ${available ? "tersedia" : "ditandai habis"}. Website diperbarui.`,
      ),
    remove: (id: string) =>
      run(async () => {
        await repo.removeMenuItem(site, id);
        setMenu((all) => without(all, id));
      }),
    reorder: (next: MenuItem[]) =>
      run(async () => {
        const menu = await repo.reorderMenu(site, ids(next));
        setMenu(() => menu);
      }, "Urutan menu disimpan. Website diperbarui."),
  };
}

export function usePosts(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  const setPosts = (fn: (p: Post[]) => Post[]) => setCache((x) => ({ ...x, posts: fn(x.posts) }));
  return {
    posts: c.posts,
    tags: c.postTags,
    /** Tag baru langsung tersimpan (meski post-nya belum disimpan). Mengembalikan tag baru, atau null jika gagal. */
    createTag: async (label: string, type: PostType): Promise<PostTag | null> => {
      const out: { tag: PostTag | null } = { tag: null };
      const ok = await run(async () => {
        const tag = await repo.createPostTag(site, { label, type });
        out.tag = tag;
        setCache((x) => ({ ...x, postTags: [...x.postTags, tag] }));
      }, `Tag “${label.trim()}” ditambahkan.`);
      return ok ? out.tag : null;
    },
    /** Pesan cepat di form; repo memeriksa lagi saat menyimpan. */
    slugTaken: (slug: string, id: string) => c.posts.some((p) => p.slug === slug && p.id !== id),
    save: (post: Post) =>
      run(async () => {
        const saved = exists(c.posts, post.id) ? await repo.updatePost(site, post) : await repo.createPost(site, post);
        setPosts((all) => upsert(all, saved));
      }),
    remove: (id: string) =>
      run(async () => {
        await repo.removePost(site, id);
        setPosts((all) => without(all, id));
      }),
  };
}

export function useGallery(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  const setGallery = (fn: (g: GalleryItem[]) => GalleryItem[]) => setCache((x) => ({ ...x, gallery: fn(x.gallery) }));
  return {
    items: c.gallery,
    add: (photos: Photo[]) =>
      run(async () => {
        const gallery = await repo.addGalleryPhotos(site, photos);
        setGallery(() => gallery);
      }),
    update: (item: GalleryItem) =>
      run(async () => {
        const saved = await repo.updateGalleryItem(site, item);
        setGallery((all) => upsert(all, saved));
      }),
    remove: (id: string) =>
      run(async () => {
        await repo.removeGalleryItem(site, id);
        setGallery((all) => without(all, id));
      }),
    reorder: (next: GalleryItem[]) =>
      run(async () => {
        const gallery = await repo.reorderGallery(site, ids(next));
        setGallery(() => gallery);
      }, "Urutan galeri disimpan. Website diperbarui."),
  };
}

export function useOutlets(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  const setOutlets = (fn: (o: Outlet[]) => Outlet[]) => setCache((x) => ({ ...x, outlets: fn(x.outlets) }));
  return {
    outlets: c.outlets,
    save: (outlet: Outlet) =>
      run(async () => {
        const saved = exists(c.outlets, outlet.id) ? await repo.updateOutlet(site, outlet) : await repo.createOutlet(site, outlet);
        setOutlets((all) => upsert(all, saved));
      }),
    remove: (id: string) =>
      run(async () => {
        await repo.removeOutlet(site, id);
        setOutlets((all) => without(all, id));
      }),
  };
}

export function useMeetingRoomInfo(site: SiteSlug) {
  const { c, run, setCache } = useSite(site);
  const apply = async (call: Promise<SiteContent["meetingRoom"]>) => {
    const meetingRoom = await call;
    setCache((x) => ({ ...x, meetingRoom }));
  };
  return {
    info: c.meetingRoom,
    update: (patch: repo.MeetingRoomInfoPatch) => run(() => apply(repo.updateMeetingRoomInfo(site, patch))),
    addPhotos: (photos: Photo[]) => run(() => apply(repo.addRoomPhotos(site, photos))),
    reorderPhotos: (next: Photo[]) =>
      run(() => apply(repo.reorderRoomPhotos(site, ids(next))), "Urutan foto disimpan. Website diperbarui."),
    removePhoto: (id: string) => run(() => apply(repo.removeRoomPhoto(site, id))),
    savePackage: (pkg: MeetingPackage) =>
      run(() =>
        apply(
          c.meetingRoom && exists(c.meetingRoom.packages, pkg.id)
            ? repo.updateMeetingPackage(site, pkg)
            : repo.createMeetingPackage(site, pkg),
        ),
      ),
    removePackage: (id: string) => run(() => apply(repo.removeMeetingPackage(site, id))),
  };
}
