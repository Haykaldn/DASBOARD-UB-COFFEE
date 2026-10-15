import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { DashboardProvider } from "@/components/store";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <DashboardProvider user={user}>
      <Shell>{children}</Shell>
    </DashboardProvider>
  );
}
