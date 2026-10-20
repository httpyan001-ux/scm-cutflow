import { getSessionUser } from "@/lib/auth";
import { discoverTopics, type DiscoveredTopic } from "@/lib/knowledge";
import { rateLimit, clientIp } from "@/lib/auth";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

/** Live web discovery when a key exists; curated knowledge-web otherwise. */
async function cloudDiscover(query: string, key: string): Promise<DiscoveredTopic[] | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "You are a knowledge-web researcher. Return ONLY valid JSON: {\"topics\":[{\"title\":string,\"myTitle\":string(Burmese),\"summary\":string(Burmese, 1-2 sentences),\"category\":string,\"source\":string(real well-known publication),\"sourceUrl\":string,\"readMins\":number,\"tags\":string[3]}]} with exactly 10 diverse, factual, surprising items. No markdown.",
          },
          { role: "user", content: `Knowledge discovery topic: ${query}` },
        ],
      }),
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    if (!Array.isArray(parsed.topics) || !parsed.topics.length) return null;
    const fallbackImgs = discoverTopics(query, 10).map((t) => t.image);
    return parsed.topics.slice(0, 10).map((t: Record<string, unknown>, i: number) => ({
      id: `t${i + 1}`,
      title: String(t.title || "").slice(0, 120),
      myTitle: String(t.myTitle || t.title || "").slice(0, 140),
      summary: String(t.summary || "").slice(0, 400),
      category: String(t.category || "Knowledge").slice(0, 40),
      source: String(t.source || "Web").slice(0, 60),
      sourceUrl: String(t.sourceUrl || "https://www.google.com/search?q=" + encodeURIComponent(String(t.title || query))),
      readMins: Number(t.readMins) || 6,
      interest: 74 + ((i * 7) % 25),
      image: fallbackImgs[i % fallbackImgs.length],
      tags: Array.isArray(t.tags) ? (t.tags as string[]).slice(0, 3).map(String) : ["knowledge"],
    }));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();

  const ip = await clientIp();
  const lim = rateLimit(`kdisc:${ip}`, 20, 10 * 60_000);
  if (!lim.ok) return Response.json({ error: "RATE_LIMITED", message: `ခဏစောင့်ပါ (${lim.retryAfter}s)။` }, { status: 429 });

  let body: { query?: string } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const query = (body.query || "general knowledge").toString().slice(0, 200).trim();

  const userKey = ((u as unknown as { aiApiKey?: string }).aiApiKey || "").trim();
  const serverKey = (process.env.OPENAI_API_KEY || "").trim();
  const provider = ((u as unknown as { aiProvider?: string }).aiProvider || "auto") as string;
  const key = provider === "offline" ? "" : userKey || serverKey;

  let topics: DiscoveredTopic[] | null = null;
  let engine: "cloud" | "offline" = "offline";
  if (key) {
    topics = await cloudDiscover(query, key);
    if (topics) engine = "cloud";
  }
  if (!topics) topics = discoverTopics(query, 10);

  return Response.json({
    ok: true,
    engine,
    query,
    count: topics.length,
    selectLimit: 5,
    topics,
    note: engine === "cloud"
      ? "အင်တာနက်ပေါ်မှ ရှာဖွေထားသော ခေါင်းစဉ် ၁၀ ခု — ကြိုက်နှစ်သက်ရာ ၅ ခု ရွေးပါ။"
      : "Knowledge-web မှ ခေါင်းစဉ် ၁၀ ခု (offline engine) — ကြိုက်နှစ်သက်ရာ ၅ ခု ရွေးပါ။",
  });
}
