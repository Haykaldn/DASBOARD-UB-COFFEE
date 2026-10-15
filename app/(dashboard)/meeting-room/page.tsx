import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MeetingRoomView from "@/components/meeting/MeetingRoomView";
import { getSessionUser } from "@/lib/auth";
import { canAccessMeetingRoom, homeFor } from "@/lib/sites";

export const metadata: Metadata = { title: "Meeting Room UB Coffee" };

export default async function MeetingRoomPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Menyembunyikan menu bukan otorisasi: akses dicek ulang di server.
  if (!canAccessMeetingRoom(user)) redirect(homeFor(user));
  return <MeetingRoomView />;
}
