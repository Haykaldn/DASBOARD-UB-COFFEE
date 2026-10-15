import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PublikasiView from "@/components/publikasi/PublikasiView";
import { getSessionUser } from "@/lib/auth";
import { canAccessSite, homeFor, isSiteSlug, SITES } from "@/lib/sites";

type Props = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site } = await params;
  return { title: isSiteSlug(site) ? `Publikasi ${SITES[site].name}` : "Publikasi" };
}

export default async function PublikasiPage({ params }: Props) {
  const { site } = await params;
  if (!isSiteSlug(site)) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Akses per situs dicek di server, bukan hanya disembunyikan di sidebar.
  if (!canAccessSite(user, site)) redirect(homeFor(user));

  return <PublikasiView key={site} slug={site} />;
}
