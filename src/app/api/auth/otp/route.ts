import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { clientIp, isGmail, normalizeGmail, rateLimit, sha256, sixDigitCode } from "@/lib/auth";
import { mailerConfigured, sendOtpMail } from "@/lib/mailer";
import { and, eq, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";
const OTP_MINUTES = 10;

export async function POST(req: Request) {
  const ip = await clientIp();
  let body: { email?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const raw = (body.email || "").trim().toLowerCase();

  if (!isGmail(raw)) {
    return Response.json({ error: "GMAIL_ONLY", message: "Gmail (@gmail.com) လိပ်စာသာ လက်ခံပါသည်။ မှန်ကန်သော Gmail ထည့်ပါ။" }, { status: 400 });
  }
  const email = normalizeGmail(raw);

  // rate limits: per-IP and per-email
  const ipLimit = rateLimit(`otp:ip:${ip}`, 8, 15 * 60_000);
  if (!ipLimit.ok) return Response.json({ error: "RATE_LIMITED", message: `တောင်းဆိုမှု များနေသည် — ${ipLimit.retryAfter}s စောင့်ပါ။` }, { status: 429 });
  const mailLimit = rateLimit(`otp:mail:${email}`, 4, 15 * 60_000);
  if (!mailLimit.ok) return Response.json({ error: "RATE_LIMITED", message: `ဤအီးမေးလ်အတွက် ခဏစောင့်ပါ (${mailLimit.retryAfter}s)။` }, { status: 429 });

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return Response.json({ error: "EMAIL_TAKEN", message: "ဤ Gmail ဖြင့် အကောင့်ရှိပြီးသားဖြစ်သည် — LOGIN ဝင်ပါ။" }, { status: 409 });
  }

  if (!mailerConfigured()) {
    return Response.json(
      {
        error: "SMTP_NOT_CONFIGURED",
        message: "အီးမေးလ်စနစ် မတပ်ဆင်ရသေးပါ။ .env တွင် SMTP_HOST / SMTP_USER / SMTP_PASS ထည့်ပြီးမှ OTP ပို့နိုင်ပါမည်။",
        hint: "Gmail → Google Account → Security → App passwords မှ 16-digit app password ယူပါ။",
      },
      { status: 503 }
    );
  }

  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60_000);

  // invalidate previous codes for this email
  await db.update(otpCodes).set({ consumed: true }).where(and(eq(otpCodes.email, email), eq(otpCodes.consumed, false), gt(otpCodes.expiresAt, new Date())));
  await db.insert(otpCodes).values({ email, codeHash: sha256(code), purpose: "register", expiresAt });

  const sent = await sendOtpMail(raw, code, OTP_MINUTES);
  if (!sent.ok) {
    return Response.json({ error: "MAIL_FAILED", message: "အီးမေးလ်ပို့မရပါ — လိပ်စာ/SMTP ကို စစ်ပါ။" }, { status: 502 });
  }

  return Response.json({ ok: true, email, expiresIn: OTP_MINUTES * 60, message: `${raw} ထံသို့ ၆ လုံး ကုဒ် ပို့ပြီးပါပြီ — Inbox / Spam စစ်ပါ။` });
}
