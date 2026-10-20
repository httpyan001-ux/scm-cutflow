import { clientIp, getSessionUser, rateLimit } from "@/lib/auth";
import { SAMPLE_MAX_SEC, SAMPLE_MIN_SEC, buildVoiceprint } from "@/lib/voiceclone";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

/** FREE voiceprint analysis — lets the user test sample quality before paying. */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();

  const ip = await clientIp();
  const lim = rateLimit(`vprint:${ip}`, 40, 10 * 60_000);
  if (!lim.ok) return Response.json({ error: "RATE_LIMITED", message: `ခဏစောင့်ပါ (${lim.retryAfter}s)။` }, { status: 429 });

  let b: { label?: string; durationSec?: number; noisy?: boolean; gender?: string } = {};
  try { b = await req.json(); } catch { /* defaults */ }

  const dur = Number(b.durationSec);
  if (!Number.isFinite(dur) || dur <= 0) {
    return Response.json({ error: "NO_SAMPLE", message: "အသံနမူနာ မရှိပါ — mic ဖြင့်သွင်းပါ သို့ ဖိုင်တင်ပါ။" }, { status: 400 });
  }

  const voiceprint = buildVoiceprint({
    label: b.label,
    durationSec: Math.min(SAMPLE_MAX_SEC, dur),
    noisy: Boolean(b.noisy),
    gender: b.gender,
  });

  return Response.json({
    ok: true,
    free: true,
    voiceprint,
    guidance: {
      minSec: SAMPLE_MIN_SEC,
      maxSec: SAMPLE_MAX_SEC,
      ideal: "20–45 စက္ကန့် · တိတ်ဆိတ်သောအခန်း · ပုံမှန်အသံနှုန်း",
    },
  });
}

export async function GET() {
  return Response.json({
    engine: "CUTFLOW Voiceprint",
    minSec: SAMPLE_MIN_SEC,
    maxSec: SAMPLE_MAX_SEC,
    free: true,
  });
}
