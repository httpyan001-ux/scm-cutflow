import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Real SMTP mail sender (Gmail / any SMTP).
 * Configure in .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=youraddress@gmail.com
 *   SMTP_PASS=16-char-app-password        (Google Account → Security → App passwords)
 *   MAIL_FROM="SCM CUTFLOW <youraddress@gmail.com>"
 */
export function mailerConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cached: Transporter | null = null;
function transporter() {
  if (cached) return cached;
  const port = Number(process.env.SMTP_PORT || 465);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string },
  });
  return cached;
}

function otpHtml(code: string, minutes: number) {
  return `<!doctype html><html><body style="margin:0;background:#04050c;font-family:'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px">
    <div style="border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:linear-gradient(160deg,#0b1024,#04050c)">
      <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.08)">
        <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:10px;background:linear-gradient(135deg,#d946ef,#22d3ee,#a3e635);color:#000;font-weight:900">SC</span>
        <span style="color:#fff;font-weight:800;letter-spacing:.12em;margin-left:10px;font-size:15px">SCM CUTFLOW</span>
        <div style="color:#67e8f9;font-size:10px;letter-spacing:.3em;margin-top:4px">AETHER-FORGE · VERIFICATION</div>
      </div>
      <div style="padding:26px 22px">
        <p style="color:#e9eefb;font-size:15px;margin:0 0 6px">မင်္ဂလာပါ 👋</p>
        <p style="color:#a7b0c6;font-size:13px;line-height:1.8;margin:0 0 18px">သင့် SCM CUTFLOW အကောင့်ဖွင့်ရန် အတည်ပြုကုဒ် (OTP) ဖြစ်ပါသည်။ ဤကုဒ်ကို မည်သူ့ကိုမျှ မပြောပါနှင့်။</p>
        <div style="text-align:center;margin:18px 0">
          <div style="display:inline-block;padding:16px 26px;border-radius:16px;background:#000;border:1px solid rgba(0,229,255,.45);box-shadow:0 0 30px rgba(0,229,255,.25)">
            <span style="color:#fff;font-size:34px;letter-spacing:12px;font-weight:900;font-family:'Courier New',monospace">${code}</span>
          </div>
        </div>
        <p style="color:#a7b0c6;font-size:12.5px;line-height:1.8;margin:12px 0 0">⏱ ဤကုဒ်သည် <b style="color:#fff">${minutes} မိနစ်</b> အတွင်းသာ အသုံးပြုနိုင်ပါသည်။</p>
        <p style="color:#6b7280;font-size:11.5px;line-height:1.7;margin:14px 0 0">သင် အကောင့်ဖွင့်ရန် မတောင်းဆိုခဲ့ပါက ဤစာကို လျစ်လျူရှုပါ — သင့်အီးမေးလ်ဖြင့် အကောင့်ဖွင့်မည် မဟုတ်ပါ။</p>
      </div>
      <div style="padding:14px 22px;border-top:1px solid rgba(255,255,255,.08);color:#4b5563;font-size:10.5px;letter-spacing:.1em">SCM CUTFLOW · automated security mail · do not reply</div>
    </div>
  </div></body></html>`;
}

export async function sendOtpMail(to: string, code: string, minutes = 10): Promise<{ ok: boolean; error?: string }> {
  if (!mailerConfigured()) return { ok: false, error: "SMTP_NOT_CONFIGURED" };
  try {
    await transporter().sendMail({
      from: process.env.MAIL_FROM || `SCM CUTFLOW <${process.env.SMTP_USER}>`,
      to,
      subject: `${code} — SCM CUTFLOW အတည်ပြုကုဒ်`,
      text: `SCM CUTFLOW verification code: ${code}\nThis code expires in ${minutes} minutes.`,
      html: otpHtml(code, minutes),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || "SEND_FAILED" };
  }
}
