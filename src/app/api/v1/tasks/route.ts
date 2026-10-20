import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DAILY_HISTORY_LIMIT, dayStart, nextMidnight, purgeOldHistory } from "@/lib/server";
import { and, desc, eq, gte } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return __unauth();

  // Nightly auto-clean: anything created before today's 00:00 is removed.
  await purgeOldHistory(u.id);

  const url = new URL(req.url);
  const limit = Math.min(DAILY_HISTORY_LIMIT, Math.max(1, Number(url.searchParams.get("limit") || DAILY_HISTORY_LIMIT)));
  const since = dayStart();

  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, u.id), gte(tasks.createdAt, since)))
    .orderBy(desc(tasks.createdAt))
    .limit(limit);

  return Response.json({
    tasks: rows.map((t) => ({
      taskId: t.id,
      task_id: t.id,
      faction: t.faction,
      status: t.status,
      progress: t.progress,
      cost: t.cost,
      createdAt: t.createdAt,
      input: t.inputPayload,
      result: t.resultPayload,
    })),
    policy: {
      dailyLimit: DAILY_HISTORY_LIMIT,
      used: rows.length,
      since: since.toISOString(),
      resetsAt: nextMidnight().toISOString(),
      note: "ည ၁၂ နာရီထိုးတိုင်း History ကို System က အလိုအလျောက် ရှင်းလင်းသည်။",
    },
  });
}
