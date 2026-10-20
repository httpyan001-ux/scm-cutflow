import { getSessionUser } from "@/lib/auth";
import { AGENT_SYSTEM_PROMPT, answer, classify, REFUSAL_BLOCKED, REFUSAL_OFFTOPIC } from "@/lib/agent";
import { FACTIONS } from "@/lib/factions";
import { GPU_COSTS, PRO_PLANS, YT_TIERS } from "@/lib/studio";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

/* Compact, non-sensitive fact sheet the cloud model may use. */
function factSheet(): string {
  const tools = FACTIONS.map((f) => `${f.name} (${f.myName}) group=${f.group} cost=${f.group === "pro" ? "PRO-unlimited" : `${f.cost}CR`} gpu=+${GPU_COSTS[f.slug] ?? 6}CR — ${f.tagline}`).join("\n");
  const plans = PRO_PLANS.map((p) => `${p.name}: standard ${p.price} Ks / BYOK ${p.byokPrice} Ks (${p.days} days)`).join("; ");
  const yt = YT_TIERS.map((t) => `${t.badge}=${t.cost}CR`).join(", ");
  return [
    "TOOLS:", tools,
    "", `PRO PLANS: ${plans}. BYOK toggle = user supplies own API key for -40% price.`,
    `CREDITS: 10 CR = 1,000 MMK. Buy in Profile > Credits slider (10-500). Payment: KBZPay, WavePay, CBPay, Visa/MPU.`,
    `GPU TURBO: 2.4x faster, extra credits per tool (4-8 CR).`,
    `RECAP duration slider: 30s to 10m max (PRO unlimited). YT PRO duration slider: 1m to 30m max, tiered pricing: ${yt}.`,
    `ASPECT RATIOS: 9:16, 16:9, 1:1, 3:4, 4:3.`,
    `API KEY: optional. Without key the offline engine works (mic speech-to-text + local summary). With key, cloud upgrade; on error it falls back automatically.`,
  ].join("\n");
}

export async function POST(req: Request) {
  let body: { message?: string; history?: { role: string; text: string }[] } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const message = (body.message || "").toString().slice(0, 1200).trim();

  if (!message) {
    return Response.json({ ok: false, verdict: "offtopic", reply: REFUSAL_OFFTOPIC, chips: ["Tool ၁၀ မျိုး", "PRO ဝင်နည်း"] }, { status: 400 });
  }

  // 1) Hard guardrail BEFORE any model call — never leaks internals.
  const verdict = classify(message);
  if (verdict === "blocked") {
    return Response.json({ ok: true, engine: "guard", verdict, reply: REFUSAL_BLOCKED, chips: ["Tool ၁၀ မျိုး", "PRO ဝင်နည်း", "Credit ဝယ်နည်း"] });
  }
  if (verdict === "offtopic") {
    return Response.json({ ok: true, engine: "guard", verdict, reply: REFUSAL_OFFTOPIC, chips: ["Tool ၁၀ မျိုး", "PRO ဝင်နည်း", "GPU TURBO ဆိုတာ?"] });
  }

  // 2) Deterministic knowledge answer (always available, zero key).
  const local = answer(message);

  // 3) Optional cloud polish — user key or server key. Falls back silently.
  let key = "";
  try {
    const u = await getSessionUser();
    const provider = ((u as unknown as { aiProvider?: string } | null)?.aiProvider || "auto") as string;
    const userKey = ((u as unknown as { aiApiKey?: string } | null)?.aiApiKey || "").trim();
    const serverKey = (process.env.OPENAI_API_KEY || "").trim();
    key = provider === "offline" ? "" : userKey || serverKey;
  } catch { key = (process.env.OPENAI_API_KEY || "").trim(); }

  if (key) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 18000);
      const hist = (body.history || []).slice(-6).map((h) => ({ role: h.role === "agent" ? "assistant" : "user", content: String(h.text).slice(0, 600) }));
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            { role: "system", content: `${AGENT_SYSTEM_PROMPT}\n\nFACTS (authoritative, never contradict):\n${factSheet()}` },
            ...hist,
            { role: "user", content: message },
            { role: "system", content: `Reference answer from the internal knowledge base (you may rephrase but must keep all facts, numbers and steps):\n${local.text}` },
          ],
        }),
      });
      clearTimeout(timer);
      if (r.ok) {
        const j = await r.json();
        const txt: string = (j?.choices?.[0]?.message?.content || "").trim();
        // Re-check output for leakage attempts
        if (txt && classify(txt) !== "blocked") {
          return Response.json({ ok: true, engine: "cloud", verdict, reply: txt, chips: local.chips });
        }
      }
    } catch { /* fall through to local */ }
  }

  return Response.json({ ok: true, engine: "offline", verdict, reply: local.text, chips: local.chips });
}

export async function GET() {
  return Response.json({
    agent: "SCM CUTFLOW Support Agent",
    scope: ["faction tools", "how tools work", "duration slider", "aspect ratio", "PRO membership", "credits", "GPU turbo", "API key/BYOK", "troubleshooting"],
    refuses: ["architecture", "source code", "tech stack", "database", "secrets", "payment bypass", "off-topic"],
    serverHasKey: Boolean((process.env.OPENAI_API_KEY || "").trim()),
  });
}
