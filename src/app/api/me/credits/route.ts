import { db } from "@/db";
import { creditOrders, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { creditsToMmk } from "@/lib/studio";
import { eq, sql } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();
  let amount = 25;
  let method = "KBPay";
  let priceMmk: number | null = null;
  try {
    const j = await req.json();
    if (typeof j?.amount === "number" && j.amount > 0 && j.amount <= 2000) amount = Math.floor(j.amount);
    if (typeof j?.method === "string" && j.method.length <= 20) method = j.method;
    if (typeof j?.priceMmk === "number" && j.priceMmk >= 0) priceMmk = Math.floor(j.priceMmk);
  } catch { /* keep default */ }
  await db.update(users).set({ credits: sql`${users.credits} + ${amount}`, updatedAt: new Date() }).where(eq(users.id, u.id));
  const finalPrice = priceMmk ?? creditsToMmk(amount);
  await db.insert(creditOrders).values({ userId: u.id, amount, priceMmk: finalPrice, method, status: "completed" });
  const rows = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  return Response.json({ ok: true, user: rows[0], added: amount, priceMmk: finalPrice, method });
}
