import { db } from "@/db";
import { creditOrders, proOrders, tasks } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return __unauth();
  const [byFaction, totals, recent, credits, pros] = await Promise.all([
    db.select({ faction: tasks.faction, n: sql<number>`count(*)::int`, spent: sql<number>`coalesce(sum(${tasks.cost}),0)::int` })
      .from(tasks).where(eq(tasks.userId, u.id)).groupBy(tasks.faction),
    db.select({ n: sql<number>`count(*)::int`, spent: sql<number>`coalesce(sum(${tasks.cost}),0)::int` })
      .from(tasks).where(eq(tasks.userId, u.id)),
    db.select().from(tasks).where(eq(tasks.userId, u.id)).orderBy(desc(tasks.createdAt)).limit(6),
    db.select().from(creditOrders).where(eq(creditOrders.userId, u.id)).orderBy(desc(creditOrders.createdAt)).limit(6),
    db.select().from(proOrders).where(eq(proOrders.userId, u.id)).orderBy(desc(proOrders.createdAt)).limit(4),
  ]);
  const fav = [...byFaction].sort((a, b) => b.n - a.n)[0]?.faction ?? null;
  return Response.json({
    totals: { jobs: totals[0]?.n ?? 0, spent: totals[0]?.spent ?? 0 },
    byFaction,
    favorite: fav,
    recent: recent.map((t) => ({ id: t.id, faction: t.faction, status: t.status, progress: t.progress, cost: t.cost, createdAt: t.createdAt })),
    creditOrders: credits,
    proOrders: pros,
  });
}
