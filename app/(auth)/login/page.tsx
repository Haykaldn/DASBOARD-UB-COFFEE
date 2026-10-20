import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEMO_ACCOUNTS, getSessionUser } from "@/lib/auth";
import { homeFor, roleLabel } from "@/lib/sites";
import { BrandMark } from "@/components/Sidebar";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Masuk Admin" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user));

  return (
    <main className="grid min-h-dvh place-items-center bg-page px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_10px_30px_-18px_rgb(15_60_107/0.35)] sm:p-8">
          <div className="mb-7">
            <BrandMark className="text-[26px]" />
            <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-ink-3 uppercase">UB Coffee · BREWi JAYA</p>
          </div>
          <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-navy">Masuk Admin</h1>
          <LoginForm />
        </div>

        {process.env.NODE_ENV !== "production" && (
          <details className="mt-4 rounded-2xl border border-line bg-white p-4 text-sm text-ink-2">
            <summary className="cursor-pointer font-semibold text-ink">Akun demo (hanya development)</summary>
            <p className="mt-2">
              Kata sandi: nilai <code className="rounded bg-page px-1">DEMO_PASSWORD</code> di <code className="rounded bg-page px-1">.env.local</code>
            </p>
            <ul className="mt-2 space-y-1">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email} className="break-all">
                  <code>{a.email}</code> — {roleLabel(a.user)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </main>
  );
}
