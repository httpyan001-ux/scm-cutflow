import { db } from "@/db";
import { proOrders, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { PRO_PLANS, proPrice, type ProMode } from "@/lib/studio";
import { eq } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    plans: PRO_PLANS.map((p) => ({
      id: p.id, name: p.name, my: p.my, days: p.days, tag: p.tag,
      standard: p.price, byok: p.byokPrice, save: p.price - p.byokPrice,
    })),
    note: "standard = platform key included (no key needed) · byok = you bring your own API key (cheaper)",
  });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();
  let planId = "30-day";
  let method = "KBPay";
  let mode: ProMode = "standard";
  let aiApiKey: string | null = null;
  try {
    const j = await req.json().catch(() => ({}));
    if (typeof j?.plan === "string") planId = j.plan;
    if (typeof j?.method === "string" && j.method.length <= 20) method = j.method;
    if (j?.mode === "byok" || j?.byok === true) mode = "byok";
    if (typeof j?.aiApiKey === "string" && j.aiApiKey.trim().length > 0 && j.aiApiKey.trim().length <= 300) aiApiKey = j.aiApiKey.trim();
  } catch { /* defaults */ }
  const plan = PRO_PLANS.find((p) => p.id === planId) ?? PRO_PLANS[0];
  const { price } = proPrice(plan.id, mode);

  // BYOK mode requires the user to actually own a key (sent now or saved before)
  if (mode === "byok") {
    const savedKey = ((u as unknown as { aiApiKey?: string }).aiApiKey || "").trim();
    if (!savedKey && !aiApiKey) {
      return Response.json(
        { error: "BYOK_KEY_REQUIRED", message: "BYOK စျေးသုံးရန် ကိုယ့် API Key အရင်ထည့်ပါ (Profile → API).", mode },
        { status: 400 }
      );
    }
  }

  const now = new Date();
  const base = u.proExpiresAt && new Date(u.proExpiresAt) > now ? new Date(u.proExpiresAt) : now;
  const exp = new Date(base.getTime() + plan.days * 24 * 3600 * 1000);
  const patch: Record<string, unknown> = { isPro: true, proStartedAt: now, proExpiresAt: exp, proPlan: plan.id, proByok: mode === "byok", updatedAt: now };
  if (aiApiKey) patch.aiApiKey = aiApiKey;
  await db.update(users).set(patch).where(eq(users.id, u.id));
  await db.insert(proOrders).values({ userId: u.id, plan: plan.id, mode, priceMmk: price, method, status: "completed" });
  const rows = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  const nu = rows[0];
  return Response.json({ ok: true, user: { ...nu, isPro: true }, plan: plan.id, mode, priceMmk: price, expiresAt: exp });
}

export async function DELETE() {
  const u = await getSessionUser();
  if (!u) return __unauth();
  await db.update(users).set({ isPro: false, updatedAt: new Date() }).where(eq(users.id, u.id));
  return Response.json({ ok: true });
}
