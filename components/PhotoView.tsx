/* eslint-disable @next/next/no-img-element -- foto dari upload (blob:/data:) dan storage, bukan aset statis */
import type { Photo } from "@/lib/types";
import Icon from "./Icon";
import { cx } from "./ui";

/** Foto atau placeholder (ikon) jika belum ada file. */
export default function PhotoView({
  photo,
  className,
  label = "Belum ada foto",
}: {
  photo: Photo | null;
  className?: string;
  label?: string;
}) {
  if (photo?.src) {
    return <img src={photo.src} alt={photo.alt} loading="lazy" className={cx("size-full object-cover", className)} />;
  }
  const hue = photo?.hue ?? 215;
  return (
    <div
      role="img"
      aria-label={photo?.alt || label}
      className={cx("grid size-full place-items-center", className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 35% 88%), hsl(${(hue + 40) % 360} 30% 78%))` }}
    >
      <Icon name="image" size={28} className="text-ink/40" />
    </div>
  );
}
