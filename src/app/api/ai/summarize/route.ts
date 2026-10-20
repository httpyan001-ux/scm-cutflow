import { getSessionUser } from "@/lib/auth";
import { offlineSummarize } from "@/lib/studio";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

/* Production BYOK summarizer:
   1) user aiApiKey (Settings) -> 2) server OPENAI_API_KEY (.env / zip fill) -> 3) OFFLINE fallback (never errors)
*/
export async function POST(req: Request) {
  let body: { transcript?: string; style?: string; maxBullets?: number } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const transcript = (body.transcript || "").toString().slice(0, 12000);
  if (transcript.trim().length < 4) {
    return Response.json({ ok: false, engine: "offline", error: "EMPTY", message: "စာသားအရင်ထည့်ပါ — mic သို့မဟုတ် ဖိုင်မှ ရယူပါ။" }, { status: 400 });
  }
  const style = (body.style || "Cinematic beats").toString();
  const maxBullets = Math.min(8, Math.max(3, Number(body.maxBullets) || 5));

  const u = await getSessionUser();
  const userKey = ((u as unknown as { aiApiKey?: string } | null)?.aiApiKey || "").trim();
  const provider = ((u as unknown as { aiProvider?: string } | null)?.aiProvider || "auto") as string;
  const serverKey = (process.env.OPENAI_API_KEY || "").trim();
  const key = provider === "offline" ? "" : userKey || serverKey;
  const keySource = provider === "offline" ? "offline-forced" : userKey ? "byok-user" : serverKey ? "server-env" : "none";

  if (key) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 22000);
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 900,
          messages: [
            { role: "system", content: "You are SCM Cutflow recap engine. Reply ONLY valid JSON: {\"bullets\": string[4-6], \"chapters\": [{\"t\":\"MM:SS\",\"title\":string,\"score\":number}], \"keywords\": string[6]}. Support Burmese + English. No markdown." },
            { role: "user", content: `Style: ${style}\nTranscript:\n${transcript}` },
          ],
        }),
      });
      clearTimeout(timer);
      if (r.ok) {
        const j = await r.json();
        const raw: string = j?.choices?.[0]?.message?.content || "";
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          if (Array.isArray(parsed.bullets)) {
            return Response.json({
              ok: true, engine: "cloud", keySource,
              bullets: parsed.bullets.slice(0, maxBullets),
              chapters: (parsed.chapters || []).slice(0, 6),
              keywords: (parsed.keywords || []).slice(0, 8),
              reading: `${transcript.split(/\s+/).length} လုံး · cloud`,
            });
          }
        }
      } else {
        const errText = await r.text().catch(() => "");
        // fall through to offline — wrong key must never hard-fail
        console.warn("cloud summarize failed, fallback:", r.status, errText.slice(0, 200));
      }
    } catch (e) {
      console.warn("cloud summarize error, fallback:", (e as Error)?.message);
    }
  }

  const off = offlineSummarize(transcript, maxBullets);
  return Response.json({ ok: true, engine: "offline", keySource, ...off, note: key ? "Cloud မရလို့ offline fallback သုံးထားသည် — API key စစ်ပါ။" : "API key မရှိပါ — offline forge (100% free, no network) သုံးနေသည်။" });
}

export async function GET() {
  const u = await getSessionUser();
  const userKey = ((u as unknown as { aiApiKey?: string } | null)?.aiApiKey || "").trim();
  return Response.json({
    serverHasKey: Boolean((process.env.OPENAI_API_KEY || "").trim()),
    userHasKey: Boolean(userKey),
    provider: ((u as unknown as { aiProvider?: string } | null)?.aiProvider || "auto"),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });
}
