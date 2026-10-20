import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { clientIp, createSession, hashPassword, isGmail, normalizeGmail, passwordStrength, publicUser, rateLimit, sha256, validateUsername } from "@/lib/auth";
import { and, desc, eq, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = await clientIp();
  const lim = rateLimit(`reg:${ip}`, 10, 15 * 60_000);
  if (!lim.ok) return Response.json({ error: "RATE_LIMITED", message: `ခဏစောင့်ပါ (${lim.retryAfter}s)။` }, { status: 429 });

  let b: { username?: string; email?: string; password?: string; confirm?: string; otp?: string } = {};
  try { b = await req.json(); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const username = (b.username || "").trim();
  const rawEmail = (b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const confirm = String(b.confirm || "");
  const otp = (b.otp || "").replace(/\D/g, "");

  const uErr = validateUsername(username);
  if (uErr) return Response.json({ error: "BAD_USERNAME", message: uErr }, { status: 400 });
  if (!isGmail(rawEmail)) return Response.json({ error: "GMAIL_ONLY", message: "Gmail (@gmail.com) သာ လက်ခံပါသည်။" }, { status: 400 });
  const email = normalizeGmail(rawEmail);

  const ps = passwordStrength(password);
  if (ps.problems.length) return Response.json({ error: "WEAK_PASSWORD", message: `စကားဝှက် အားနည်းသည် — ${ps.problems.join(" · ")}` }, { status: 400 });
  if (password !== confirm) return Response.json({ error: "PASSWORD_MISMATCH", message: "စကားဝှက် နှစ်ခု မတူပါ။" }, { status: 400 });
  if (!/^\d{6}$/.test(otp)) return Response.json({ error: "BAD_OTP", message: "၆ လုံး OTP ကုဒ် ထည့်ပါ။" }, { status: 400 });

  // duplicate checks
  const dupEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dupEmail[0]) return Response.json({ error: "EMAIL_TAKEN", message: "ဤ Gmail ဖြင့် အကောင့်ရှိပြီးသား — LOGIN ဝင်ပါ။" }, { status: 409 });
  const dupUser = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (dupUser[0]) return Response.json({ error: "USERNAME_TAKEN", message: "ဤ USERNAME ကို အသုံးပြုပြီးသား — အခြားတစ်ခု ရွေးပါ။" }, { status: 409 });

  // OTP must exist, be live and match (real mail only — no bypass)
  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), eq(otpCodes.consumed, false), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  const rec = rows[0];
  if (!rec) return Response.json({ error: "OTP_EXPIRED", message: "OTP သက်တမ်းကုန်သွားပြီ — ကုဒ်အသစ် ပြန်တောင်းပါ။" }, { status: 400 });
  if (rec.attempts >= 5) {
    await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, rec.id));
    return Response.json({ error: "OTP_LOCKED", message: "ကုဒ်မှားမှု များနေသည် — ကုဒ်အသစ် တောင်းပါ။" }, { status: 429 });
  }
  if (rec.codeHash !== sha256(otp)) {
    await db.update(otpCodes).set({ attempts: rec.attempts + 1 }).where(eq(otpCodes.id, rec.id));
    return Response.json({ error: "OTP_INVALID", message: `ကုဒ်မမှန်ပါ — ${4 - rec.attempts} ကြိမ် ကျန်သည်။` }, { status: 400 });
  }
  await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, rec.id));

  const inserted = await db
    .insert(users)
    .values({
      email,
      username,
      displayName: username,
      passwordHash: hashPassword(password),
      emailVerified: true,
      credits: 60,
    })
    .returning();

  const u = inserted[0];
  await createSession(u.id);
  return Response.json({ ok: true, user: publicUser(u), message: `ကြိုဆိုပါတယ် ${username}! အကောင့်ဖွင့်ပြီးပါပြီ — 60 CR လက်ဆောင်ရပြီ။` }, { status: 201 });
}
