import { db } from "@/db";
import { users } from "@/db/schema";
import { clientIp, createSession, destroySession, getSessionUser, normalizeGmail, publicUser, rateLimit, verifyPassword } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";
const MAX_FAILS = 6;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  const ip = await clientIp();
  const lim = rateLimit(`login:${ip}`, 12, 10 * 60_000);
  if (!lim.ok) return Response.json({ error: "RATE_LIMITED", message: `ဝင်ရန်ကြိုးစားမှု များနေသည် — ${lim.retryAfter}s စောင့်ပါ။` }, { status: 429 });

  let b: { identity?: string; password?: string } = {};
  try { b = await req.json(); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const identityRaw = (b.identity || "").trim();
  const password = String(b.password || "");
  if (!identityRaw || !password) return Response.json({ error: "MISSING", message: "USERNAME/Gmail နှင့် စကားဝှက် ထည့်ပါ။" }, { status: 400 });

  const asEmail = identityRaw.includes("@") ? normalizeGmail(identityRaw.toLowerCase()) : "";
  const rows = await db
    .select()
    .from(users)
    .where(asEmail ? or(eq(users.email, asEmail), eq(users.username, identityRaw)) : eq(users.username, identityRaw))
    .limit(1);
  const u = rows[0];

  // uniform failure response (no account enumeration)
  const fail = () => Response.json({ error: "INVALID_CREDENTIALS", message: "USERNAME/Gmail သို့ စကားဝှက် မမှန်ပါ။" }, { status: 401 });

  if (!u || !u.passwordHash) return fail();
  if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(u.lockedUntil).getTime() - Date.now()) / 60000);
    return Response.json({ error: "LOCKED", message: `လုံခြုံရေးအရ ပိတ်ထားသည် — ${mins} မိနစ်အကြာ ပြန်ကြိုးစားပါ။` }, { status: 423 });
  }
  if (!verifyPassword(password, u.passwordHash)) {
    const fails = u.failedLogins + 1;
    await db
      .update(users)
      .set({ failedLogins: fails, lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null, updatedAt: new Date() })
      .where(eq(users.id, u.id));
    return fail();
  }
  if (!u.emailVerified) return Response.json({ error: "NOT_VERIFIED", message: "အီးမေးလ် အတည်မပြုရသေးပါ — ပြန်လည် REGISTER လုပ်ပါ။" }, { status: 403 });

  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, u.id));
  await createSession(u.id);
  return Response.json({ ok: true, user: publicUser(u), message: `ပြန်လည်ကြိုဆိုပါတယ် ${u.username ?? u.displayName}!` });
}

export async function DELETE() {
  await destroySession();
  return Response.json({ ok: true });
}

export async function GET() {
  const u = await getSessionUser();
  return Response.json({ authenticated: Boolean(u), user: publicUser(u) });
}
