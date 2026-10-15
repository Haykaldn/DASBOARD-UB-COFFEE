export const TZ = "Asia/Jakarta";

/** index 0 = Senin … 6 = Minggu */
export const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

/** Tanggal hari ini (YYYY-MM-DD) di zona Asia/Jakarta. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Jam sekarang (HH:MM) di zona Asia/Jakarta. */
export function nowHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = Senin … 6 = Minggu */
export function weekdayIndex(iso: string): number {
  return (parse(iso).getUTCDay() + 6) % 7;
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parse(iso));
}

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parse(iso));
}

export function formatDateMedium(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parse(iso));
}

export function formatDateTime(isoTs: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTs));
}

/** "09:00" → "09.00" */
export function hhmm(t: string): string {
  return t.replace(":", ".");
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function rupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

/** 6281234561021 → 0812-3456-1021 */
export function formatPhone(e164: string): string {
  const local = e164.startsWith("62") ? "0" + e164.slice(2) : e164;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Normalisasi ke E.164 tanpa "+". Null jika tidak valid (10–15 digit). */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!/^62\d{8,13}$/.test(d)) return null;
  return d;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Kode booking acak, tidak berurutan: MR-1017-7KQ2 */
export function bookingCode(dateISO: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `MR-${dateISO.slice(5, 7)}${dateISO.slice(8, 10)}-${r}`;
}

export function isHttpsUrl(v: string): boolean {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}
