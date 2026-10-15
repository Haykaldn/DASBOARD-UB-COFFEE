/**
 * Auth sementara (tanpa database). Akun demo + session cookie bertanda tangan HMAC.
 * Diganti Auth.js v5 (Credentials, session DB, argon2id) di milestone 1 (§5, §10).
 * Hanya dipakai di server (server action, layout, page).
 */
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "cms_session";
const MAX_AGE_SEC = 8 * 60 * 60; // 8 jam

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET belum diisi");
  return "dev-only-secret-ganti-di-env";
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "brawijaya-admin-2026";
const SALT = "cms-demo-salt";
const hash = (pw: string) => scryptSync(pw, SALT, 32);
const DEMO_HASH = hash(DEMO_PASSWORD);

const USERS: SessionUser[] = [
  { id: "u1", name: "Super Admin", email: "super@ubcoffee.id", role: "SUPER_ADMIN", sites: ["ub-coffee", "brewi-jaya"] },
  { id: "u2", name: "Admin UB Coffee", email: "ubcoffee@ubcoffee.id", role: "SITE_ADMIN", sites: ["ub-coffee"] },
  { id: "u3", name: "Admin BREWi JAYA", email: "brewijaya@ubcoffee.id", role: "SITE_ADMIN", sites: ["brewi-jaya"] },
];

export const DEMO_ACCOUNTS = USERS.map((u) => ({ email: u.email, user: u }));

export function verifyCredentials(email: string, password: string): SessionUser | null {
  const user = USERS.find((u) => u.email === email.trim().toLowerCase());
  // Selalu hitung hash agar waktu respons sama untuk email ada / tidak ada.
  const ok = timingSafeEqual(hash(password), DEMO_HASH);
  return user && ok ? user : null;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE_SEC * 1000 })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

export async function setSessionCookie(userId: string) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    if (Date.now() > exp) return null;
    return USERS.find((u) => u.id === uid) ?? null;
  } catch {
    return null;
  }
}
