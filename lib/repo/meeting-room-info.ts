/**
 * Isi tab Reservasi website (info meeting room, foto ruangan, paket). Jadwal booking ada di bookings.ts.
 * Nanti: Prisma. Situs tanpa info meeting room ditolak.
 */
import type { MeetingPackage, MeetingRoomInfo, Photo, SiteSlug } from "../types";
import { clone, delay, reorderByIds, replaceById, SAVE_DELAY_MS, siteContent } from "./mock-db";

export type MeetingRoomInfoPatch = Partial<Omit<MeetingRoomInfo, "photos" | "packages">>;

/** Ubah info lewat `fn`, simpan, dan kembalikan salinannya. */
async function change(site: SiteSlug, fn: (m: MeetingRoomInfo) => MeetingRoomInfo): Promise<MeetingRoomInfo> {
  await delay(SAVE_DELAY_MS);
  const c = siteContent(site);
  if (!c.meetingRoom) throw new Error("NO_MEETING_ROOM");
  c.meetingRoom = fn(c.meetingRoom);
  return clone(c.meetingRoom);
}

export function updateMeetingRoomInfo(site: SiteSlug, patch: MeetingRoomInfoPatch) {
  return change(site, (m) => ({ ...m, ...patch }));
}

export function addRoomPhotos(site: SiteSlug, photos: Photo[]) {
  return change(site, (m) => ({ ...m, photos: [...m.photos, ...photos] }));
}

export function reorderRoomPhotos(site: SiteSlug, ids: string[]) {
  return change(site, (m) => ({ ...m, photos: reorderByIds(m.photos, ids) }));
}

export function removeRoomPhoto(site: SiteSlug, id: string) {
  return change(site, (m) => ({ ...m, photos: m.photos.filter((x) => x.id !== id) }));
}

export function createMeetingPackage(site: SiteSlug, pkg: MeetingPackage) {
  return change(site, (m) => ({ ...m, packages: [...m.packages, pkg] }));
}

export function updateMeetingPackage(site: SiteSlug, pkg: MeetingPackage) {
  return change(site, (m) => ({ ...m, packages: replaceById(m.packages, pkg) }));
}

export function removeMeetingPackage(site: SiteSlug, id: string) {
  return change(site, (m) => ({ ...m, packages: m.packages.filter((x) => x.id !== id) }));
}
