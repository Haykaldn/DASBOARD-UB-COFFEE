"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cx } from "./ui";

/**
 * Kerangka halaman: sidebar putih di kiri + banner navy di atas (gaya SupplyFlow).
 * Tombol panel di banner menyembunyikan sidebar (desktop) atau membuka laci (mobile).
 */
export default function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Laci mobile tertutup setiap pindah halaman.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggle = () => {
    if (window.matchMedia("(min-width: 761px)").matches) setCollapsed((c) => !c);
    else setMobileOpen((o) => !o);
  };

  return (
    <>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={cx("min-w-0 transition-[padding] duration-200", !collapsed && "md:pl-[240px]")}>
        <div className="px-3 pt-3 md:px-6 md:pt-4">
          <TopBar onToggleNav={toggle} />
        </div>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-7">{children}</main>
      </div>
    </>
  );
}
