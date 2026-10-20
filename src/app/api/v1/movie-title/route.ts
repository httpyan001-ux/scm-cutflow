import { clientIp, getSessionUser, rateLimit } from "@/lib/auth";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

/** Offline heuristic: pull a plausible title + year out of a filename / YouTube title. */
function offlineDetect(raw: string): { title: string; year: string; confidence: number } {
  let s = (raw || "").trim();
  s = s.replace(/\.[a-z0-9]{2,4}$/i, "");                       // extension
  const yearMatch = s.match(/\b(19[3-9]\d|20[0-4]\d)\b/);
  const year = yearMatch ? yearMatch[1] : "";
  s = s
    .replace(/\b(19[3-9]\d|20[0-4]\d)\b/g, " ")
    .replace(/\b(1080p|720p|2160p|4k|hd|fhd|uhd|bluray|brrip|webrip|web-dl|hdrip|dvdrip|x264|x265|hevc|aac|ddp?5\.1|hdtv|remux|proper|repack)\b/gi, " ")
    .replace(/\b(official|trailer|teaser|full\s*movie|movie\s*clip|scene|recap|explained|review|part\s*\d+|ep\.?\s*\d+)\b/gi, " ")
    .replace(/[._\-\[\]()|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const title = s
    .split(" ")
    .filter(Boolean)
    .slice(0, 8)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  const confidence = title ? (year ? 72 : 54) : 20;
  return { title: title || "Unknown Title", year, confidence };
}

/**
 * Detect MOVIE TITLE + release year.
 * Uses Gemini when a key is configured, otherwise a deterministic
 * filename/metadata heuristic — so it always returns something.
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();

  const ip = await clientIp();
  const lim = rateLimit(`mtitle:${ip}`, 30, 10 * 60_000);
  if (!lim.ok) return Response.json({ error: "RATE_LIMITED", message: `ခဏစောင့်ပါ (${lim.retryAfter}s)။` }, { status: 429 });

  let b: { hint?: string; url?: string; fileName?: string } = {};
  try { b = await req.json(); } catch { /* defaults */ }
  const hint = (b.hint || b.fileName || b.url || "").toString().slice(0, 300);

  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (geminiKey && hint) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Identify the movie or series this video refers to. " +
                      'Reply ONLY minified JSON: {"title":string,"year":string,"confidence":number 0-100}. ' +
                      "If unsure, give your best guess with low confidence.\n\nVideo reference: " +
                      hint,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
          }),
        }
      );
      clearTimeout(timer);
      if (r.ok) {
        const j = await r.json();
        const text: string = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          if (parsed?.title) {
            return Response.json({
              ok: true,
              engine: "gemini",
              title: String(parsed.title).slice(0, 80),
              year: String(parsed.year ?? "").replace(/\D/g, "").slice(0, 4),
              confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 70)),
            });
          }
        }
      }
    } catch { /* fall through */ }
  }

  const off = offlineDetect(hint);
  return Response.json({
    ok: true,
    engine: "offline",
    ...off,
    note: geminiKey ? "Gemini မရလို့ offline detect သုံးထားသည်။" : "GEMINI_API_KEY မရှိပါ — filename မှ ခန့်မှန်းထားသည်။",
  });
}
