"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie, verifyCredentials } from "@/lib/auth";
import { hit, isLimited, reset } from "@/lib/ratelimit";
import { homeFor } from "@/lib/sites";

export type LoginState = { error: string | null; email: string };

const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const TOO_MANY = "Terlalu banyak percobaan. Coba lagi dalam 15 menit.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const password = String(formData.get("password") ?? "").slice(0, 200);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `login:${email}:${ip}`;

  if (isLimited(key, LIMIT)) return { error: TOO_MANY, email };

  const user = email && password ? verifyCredentials(email, password) : null;
  if (!user) {
    const r = hit(key, LIMIT, WINDOW_MS);
    return { error: r.ok ? "Email atau kata sandi salah" : TOO_MANY, email };
  }

  reset(key);
  await setSessionCookie(user.id);
  redirect(homeFor(user));
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
