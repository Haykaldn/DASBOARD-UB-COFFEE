import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { homeFor } from "@/lib/sites";

export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? homeFor(user) : "/login");
}
