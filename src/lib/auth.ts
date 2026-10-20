import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";

export const SESSION_COOKIE = "cutflow_session";
const SESSION_DAYS = 14;

/* ---------------- password hashing (scrypt, no external dep) ---------------- */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${dk.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, N, r, p, salt, hex] = parts;
    const dk = crypto.scryptSync(password.normalize("NFKC"), salt, 64, { N: Number(N), r: Number(r), p: Number(p) });
    const a = Buffer.from(hex, "hex");
    return a.length === dk.length && crypto.timingSafeEqual(a, dk);
  } catch {
    return false;
  }
}

/* ---------------- tokens ---------------- */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
export function sha256(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex");
}
export function sixDigitCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/* ---------------- validation ---------------- */
const GMAIL_RE = /^[a-z0-9](?:[a-z0-9._%+-]{4,28})[a-z0-9]@gmail\.com$/i;
export function isGmail(email: string): boolean {
  const e = (email || "").trim().toLowerCase();
  if (!GMAIL_RE.test(e)) return false;
  if (e.includes("..")) return false;
  const local = e.split("@")[0];
  // block obvious throwaway patterns
  if (/^(test|fake|temp|tmp|spam|abuse|noreply|no-reply|admin|root)\d*$/.test(local)) return false;
  return true;
}
export function normalizeGmail(email: string): string {
  const e = (email || "").trim().toLowerCase();
  const [local, domain] = e.split("@");
  // Gmail ignores dots and +suffix — normalize so one inbox = one account
  const base = local.split("+")[0].replace(/\./g, "");
  return `${base}@${domain}`;
}

export function validateUsername(u: string): string | null {
  const v = (u || "").trim();
  if (v.length < 3 || v.length > 20) return "USERNAME 3–20 လုံး ဖြစ်ရမည်";
  if (!/^[a-zA-Z0-9_.]+$/.test(v)) return "USERNAME တွင် a-z, 0-9, _ , . သာ သုံးနိုင်သည်";
  if (/^[._]|[._]$/.test(v)) return "USERNAME ကို . သို့ _ ဖြင့် စ/ဆုံး မရပါ";
  return null;
}

export function passwordStrength(p: string): { score: number; problems: string[] } {
  const problems: string[] = [];
  if (p.length < 8) problems.push("အနည်းဆုံး ၈ လုံး");
  if (!/[a-z]/.test(p)) problems.push("စာလုံးအသေး (a-z)");
  if (!/[A-Z]/.test(p)) problems.push("စာလုံးအကြီး (A-Z)");
  if (!/[0-9]/.test(p)) problems.push("ဂဏန်း (0-9)");
  if (/^(password|12345678|qwerty|cutflow)/i.test(p)) problems.push("မှန်းရလွယ်သော စကားဝှက် မဖြစ်ရ");
  const score = Math.max(0, 5 - problems.length);
  return { score, problems };
}

/* ---------------- rate limiting (in-memory, per instance) ---------------- */
type Bucket = { count: number; reset: number };
const globalForRate = globalThis as typeof globalThis & { __cutflowRate?: Map<string, Bucket> };
const buckets = globalForRate.__cutflowRate ?? new Map<string, Bucket>();
globalForRate.__cutflowRate = buckets;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

/* ---------------- sessions ---------------- */
export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    userAgent: (h.get("user-agent") || "").slice(0, 200),
    ip: (await clientIp()).slice(0, 60),
    expiresAt,
  });
  // When the app is served over HTTPS it may also be rendered inside a trusted
  // preview iframe (cross-site), where SameSite=Lax cookies are dropped.
  // Use SameSite=None+Secure on HTTPS, Lax on plain HTTP (local dev).
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim();
  const isHttps = proto === "https";
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
    expires: expiresAt,
  });
  // opportunistic cleanup
  db.delete(sessions).where(lt(sessions.expiresAt, new Date())).catch(() => {});
  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token))).catch(() => {});
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ u: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0]?.u;
  if (!u) return null;
  if (u.isPro && u.proExpiresAt && new Date(u.proExpiresAt) < new Date()) {
    await db.update(users).set({ isPro: false, updatedAt: new Date() }).where(eq(users.id, u.id));
    return { ...u, isPro: false };
  }
  return u;
}

/** Throws a 401 Response when not signed in. */
export async function requireUser() {
  const u = await getSessionUser();
  if (!u) throw new Response(JSON.stringify({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }), { status: 401, headers: { "Content-Type": "application/json" } });
  return u;
}

export function publicUser(u: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar,
    photoUrl: u.photoUrl,
    background: u.background,
    backgroundUrl: u.backgroundUrl,
    themePrimary: u.themePrimary,
    themeSecondary: u.themeSecondary,
    hasAiKey: Boolean(u.aiApiKey),
    aiProvider: u.aiProvider,
    isPro: u.isPro,
    proExpiresAt: u.proExpiresAt,
    proStartedAt: u.proStartedAt,
    proPlan: u.proPlan,
    proByok: u.proByok,
    credits: u.credits,
    emailVerified: u.emailVerified,
    serverHasKey: Boolean(process.env.OPENAI_API_KEY),
  };
}
