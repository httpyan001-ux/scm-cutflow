import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getFaction } from "@/lib/factions";
import { DAILY_HISTORY_LIMIT, purgeOldHistory, todayJobCount } from "@/lib/server";
import { produceVideo, type DiscoveredTopic } from "@/lib/knowledge";
import { ASPECT_RATIOS, DEFAULT_ASPECT, gpuCostFor } from "@/lib/studio";
import { enqueueGpuJob } from "@/lib/gpu-worker";
import { and, eq, sql } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return __unauth();

  const faction = getFaction("knowledge")!;
  let body: { topics?: DiscoveredTopic[]; query?: string; aspect?: string; voice?: string; gpu?: boolean } = {};
  try { body = await req.json(); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const picks = Array.isArray(body.topics) ? body.topics.slice(0, 5) : [];
  if (picks.length !== 5) {
    return Response.json({ error: "NEED_FIVE", message: "ခေါင်းစဉ် ၅ ခု အတိအကျ ရွေးပါ။", selected: picks.length }, { status: 400 });
  }

  await purgeOldHistory(user.id);
  const used = await todayJobCount(user.id);
  if (used >= DAILY_HISTORY_LIMIT) {
    return Response.json({ error: "DAILY_LIMIT", message: `တစ်ရက်လျှင် ${DAILY_HISTORY_LIMIT} ပုဒ်သာ ထုတ်နိုင်သည် — ည ၁၂ နာရီထိုးရင် ပြန်စမည်။` }, { status: 429 });
  }

  const gpu = body.gpu === true;
  const gpuCost = gpuCostFor("knowledge");
  const baseCost = faction.cost; // 5 CR
  const totalCost = baseCost + (gpu ? gpuCost : 0);

  const updated = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${totalCost}`, updatedAt: new Date() })
    .where(and(eq(users.id, user.id), sql`${users.credits} >= ${totalCost}`))
    .returning({ credits: users.credits });
  if (!updated[0]) {
    return Response.json(
      { error: "INSUFFICIENT_CREDITS", message: `Need ${totalCost} CR — balance is ${user.credits} CR.`, balance: user.credits, cost: totalCost, gpu, gpuCost },
      { status: 402 }
    );
  }

  const aspectRaw = typeof body.aspect === "string" ? body.aspect : DEFAULT_ASPECT;
  const aspect = ASPECT_RATIOS.some((a) => a.id === aspectRaw) ? aspectRaw : DEFAULT_ASPECT;
  const produced = produceVideo(picks, { query: body.query, voice: body.voice, aspect });

  const inserted = await db
    .insert(tasks)
    .values({
      userId: user.id,
      faction: "knowledge",
      status: "queued",
      progress: 4,
      cost: totalCost,
      inputPayload: {
        mode: "discover-produce",
        query: body.query || "",
        aspect,
        gpu,
        renderMode: gpu ? "gpu" : "cpu",
        targetDuration: produced.totalSeconds,
        picks: picks.map((p) => ({ id: p.id, title: p.myTitle, source: p.source })),
        fileName: produced.download,
      },
      lane: gpu ? "gpu" : "cpu",
      runner: gpu ? "colab" : "vps",
      stage: gpu ? "WAITING FOR T4" : "",
      resultPayload: {
        ...produced,
        faction: "knowledge",
        gpu,
        renderLane: gpu ? "GPU-TURBO" : "CPU-FORGE",
        length: `${Math.floor(produced.totalSeconds / 60)}m ${produced.totalSeconds % 60}s`,
      },
    })
    .returning();

  const task = inserted[0];
  const dispatch = gpu ? await enqueueGpuJob(task.id) : null;
  return Response.json(
    {
      ok: true,
      task_id: task.id,
      taskId: task.id,
      status: "queued",
      cost: totalCost,
      gpu,
      lane: gpu ? "GPU-TURBO" : "CPU-FORGE",
      runner: gpu ? "colab" : "vps",
      gpuNode: dispatch?.workerId ?? null,
      aspect,
      totalSeconds: produced.totalSeconds,
      poll: `/api/v1/tasks/${task.id}`,
      preview: { caption: produced.caption, lines: produced.lines.length, images: produced.images.length },
      message: `KNOWLEDGE video queued · ${produced.lines.length} scenes · ${produced.totalSeconds}s`,
    },
    { status: 202 }
  );
}
