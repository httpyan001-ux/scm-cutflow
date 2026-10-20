import { getSessionUser, clientIp, rateLimit } from "@/lib/auth";
import { scanCopyright, type ShieldLevel } from "@/lib/copyright";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

/**
 * FREE instant scan — no credits, no task row.
 * Lets the user self-check any output before posting.
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();

  const ip = await clientIp();
  const lim = rateLimit(`scan:${ip}`, 30, 10 * 60_000);
  if (!lim.ok) return Response.json({ error: "RATE_LIMITED", message: `ခဏစောင့်ပါ (${lim.retryAfter}s)။` }, { status: 429 });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* defaults */ }

  const allowed: ShieldLevel[] = ["off", "standard", "aggressive", "maximum"];
  const level = allowed.includes(b.shieldLevel as ShieldLevel) ? (b.shieldLevel as ShieldLevel) : "standard";

  const report = scanCopyright({
    shieldLevel: level,
    hasMusic: b.hasMusic !== false,
    hasCommentary: Boolean(b.hasCommentary),
    hasAttribution: Boolean(b.hasAttribution),
    longestClipSec: Number(b.longestClipSec) || undefined,
    totalSec: Number(b.totalSec) || undefined,
    voiceReplaced: Boolean(b.voiceReplaced),
    logoRemoved: Boolean(b.logoRemoved),
    title: typeof b.title === "string" ? b.title : undefined,
  });

  return Response.json({ ok: true, free: true, report });
}

export async function GET() {
  return Response.json({
    scanner: "CUTFLOW Claim Radar",
    signals: 8,
    platforms: ["YouTube", "Meta", "TikTok"],
    free: true,
    note: "POST video attributes to receive a claim-risk report.",
  });
}
