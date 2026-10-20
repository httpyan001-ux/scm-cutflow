import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getFaction } from "@/lib/factions";
import { DAILY_HISTORY_LIMIT, purgeOldHistory, todayJobCount } from "@/lib/server";
import { buildMagicReel, newSeed, type ReelCategory } from "@/lib/magicreel";
import { enqueueGpuJob } from "@/lib/gpu-worker";
import { ASPECT_RATIOS, DEFAULT_ASPECT, gpuCostFor } from "@/lib/studio";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });

export const dynamic = "force-dynamic";

/** ONE-CLICK GENERATE — PRO unlimited, GPU optional. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return __unauth();

  const faction = getFaction("magic")!;
  if (!user.isPro) {
    return Response.json(
      { error: "PRO_REQUIRED", message: "MAGIC REEL AI သည် PRO member များအတွက်သာ ဖြစ်သည်။", upgradeUrl: "/#pro" },
      { status: 402 }
    );
  }

  let b: { category?: string; targetSeconds?: number; aspect?: string; gpu?: boolean } = {};
  try { b = await req.json(); } catch { /* defaults */ }

  const category: ReelCategory = b.category === "accident" ? "accident" : "funny";
  const target = Math.max(30, Math.min(90, Number(b.targetSeconds) || 60));
  const aspectRaw = typeof b.aspect === "string" ? b.aspect : "9:16";
  const aspect = ASPECT_RATIOS.some((a) => a.id === aspectRaw) ? aspectRaw : DEFAULT_ASPECT;
  const gpu = b.gpu === true;
  const gpuCost = gpuCostFor("magic");

  await purgeOldHistory(user.id);
  const used = await todayJobCount(user.id);
  if (used >= DAILY_HISTORY_LIMIT) {
    return Response.json({ error: "DAILY_LIMIT", message: `တစ်ရက်လျှင် ${DAILY_HISTORY_LIMIT} ပုဒ်သာ ထုတ်နိုင်သည်။` }, { status: 429 });
  }

  // GPU is the only cost (PRO base = 0)
  if (gpu) {
    const { db: _db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");
    const updated = await _db
      .update(users)
      .set({ credits: sql`${users.credits} - ${gpuCost}`, updatedAt: new Date() })
      .where(and(eq(users.id, user.id), sql`${users.credits} >= ${gpuCost}`))
      .returning({ credits: users.credits });
    if (!updated[0]) {
      return Response.json(
        { error: "INSUFFICIENT_CREDITS", message: `GPU TURBO needs ${gpuCost} CR — balance is ${user.credits} CR.`, balance: user.credits, cost: gpuCost, gpu: true, gpuCost },
        { status: 402 }
      );
    }
  }

  const reel = buildMagicReel({ category, targetSeconds: target, aspect, seed: newSeed() });

  const inserted = await db
    .insert(tasks)
    .values({
      userId: user.id,
      faction: "magic",
      status: "queued",
      progress: 4,
      cost: gpu ? gpuCost : 0,
      inputPayload: {
        mode: "magic-reel",
        category,
        targetDuration: target,
        aspect,
        gpu,
        renderMode: gpu ? "gpu" : "cpu",
        clipCount: reel.clipCount,
        fileName: reel.download,
      },
      resultPayload: { ...reel, faction: "magic", gpu, renderLane: gpu ? "GPU-TURBO" : "CPU-FORGE", length: `${reel.totalSeconds}s` },
      lane: gpu ? "gpu" : "cpu",
      runner: gpu ? "colab" : "vps",
      stage: gpu ? "WAITING FOR T4" : "",
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
      cost: gpu ? gpuCost : 0,
      gpu,
      lane: gpu ? "GPU-TURBO" : "CPU-FORGE",
      gpuNode: dispatch?.workerId ?? null,
      category,
      aspect,
      clipCount: reel.clipCount,
      totalSeconds: reel.totalSeconds,
      viralScore: reel.viralScore,
      sourceDemo: reel.sourceDemo,
      poll: `/api/v1/tasks/${task.id}`,
      message: `MAGIC REEL queued · ${reel.clipCount} clips · ${reel.totalSeconds}s`,
    },
    { status: 202 }
  );
}
