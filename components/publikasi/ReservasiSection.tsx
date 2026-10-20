"use client";

import Link from "next/link";
import type { SiteConfig } from "@/lib/types";
import { useMeetingRoomInfo } from "../data-hooks";
import Icon from "../Icon";
import { SectionCard } from "../ui";
import { InfoForm } from "./reservasi/InfoForm";
import { PackagesBlock } from "./reservasi/PackagesBlock";
import { PhotosBlock } from "./reservasi/PhotosBlock";

/** Tab "Reservasi" website UB Coffee: informasi meeting room, harga sewa, foto, dan paket. */
export default function ReservasiSection({ site }: { site: SiteConfig }) {
  const { info } = useMeetingRoomInfo(site.slug);
  if (!info) return null;

  return (
    <SectionCard
      id="reservasi"
      title="Reservasi Meeting Room"
      description="Isi tab Reservasi website: informasi ruangan, harga sewa, foto, dan paket meeting."
      action={
        <Link
          href="/meeting-room"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:bg-page"
        >
          <Icon name="calendar" size={18} />
          Kelola jadwal booking
        </Link>
      }
    >
      <div className="grid gap-8">
        <InfoForm site={site} info={info} />
        <PhotosBlock site={site} photos={info.photos} />
        <PackagesBlock site={site} info={info} />
      </div>
    </SectionCard>
  );
}
