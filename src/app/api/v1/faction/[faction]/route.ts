import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { getFaction } from "@/lib/factions";
import { DAILY_HISTORY_LIMIT, clampTargetDuration, isProActive, purgeOldHistory, todayJobCount } from "@/lib/server";
import { getSessionUser } from "@/lib/auth";
import { ASPECT_RATIOS, DEFAULT_ASPECT, baseCostFor, durationSpec, fmtDuration, gpuCostFor, ytTierFor } from "@/lib/studio";
import { enqueueGpuJob } from "@/lib/gpu-worker";
import { sanitizePrefs, buildCropPlan } from "@/lib/studio-prefs";
import { and, eq, sql } from "drizzle-orm";

const __unauth = () => Response.json({ error: "UNAUTHORIZED", message: "အကောင့်ဝင်ရန် လိုအပ်သည်။" }, { status: 401 });


export const dynamic = "force-dynamic";

async function parseInput(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const out: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) {
        out[`${k}FileName`] = v.name;
        out[`${k}Size`] = v.size;
        out[`${k}Type`] = v.type;
        if (!out.fileName) {
          out.fileName = v.name;
          out.fileSize = v.size;
          out.fileType = v.type;
        }
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  try {
    const j = await req.json();
    if (j && typeof j === "object") return j as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

function wantsGpu(input: Record<string, unknown>, url: URL): boolean {
  if (input.gpu === true || input.gpu === "true" || input.gpu === 1 || input.gpu === "1") return true;
  if (input.renderMode === "gpu" || input.renderMode === "turbo") return true;
  const q = url.searchParams.get("gpu");
  return q === "1" || q === "true";
}

export async function POST(req: Request, ctx: { params: Promise<{ faction: string }> }) {
  const { faction: slug } = await ctx.params;
  const faction = getFaction(slug);
  if (!faction) return Response.json({ error: `Unknown faction: ${slug}` }, { status: 404 });

  const url = new URL(req.url);
  const user = await getSessionUser();
  if (!user) return __unauth();
  const proActive = isProActive({ isPro: user.isPro, proExpiresAt: user.proExpiresAt });
  const input = await parseInput(req);

  // Daily quota: 10 renders per calendar day (auto-resets at midnight).
  await purgeOldHistory(user.id);
  const usedToday = await todayJobCount(user.id);
  if (usedToday >= DAILY_HISTORY_LIMIT) {
    return Response.json(
      { error: "DAILY_LIMIT", message: `တစ်ရက်လျှင် ${DAILY_HISTORY_LIMIT} ပုဒ်သာ ထုတ်နိုင်သည် — ည ၁၂ နာရီထိုးရင် ပြန်စမည်။`, used: usedToday, limit: DAILY_HISTORY_LIMIT },
      { status: 429 }
    );
  }

  const gpu = wantsGpu(input, url);
  const gpuCost = gpuCostFor(faction.slug);

  // ---- duration slider (server-clamped) + aspect ratio ----
  const spec = durationSpec(faction.slug);
  const targetDuration = spec ? clampTargetDuration(faction.slug, input.targetDuration ?? input.durationSec) : null;
  const aspectRaw = typeof input.aspect === "string" ? input.aspect : DEFAULT_ASPECT;
  const aspect = ASPECT_RATIOS.some((a) => a.id === aspectRaw) ? aspectRaw : DEFAULT_ASPECT;

  // Server-enforced business rules
  if (faction.group === "pro" && !proActive) {
    return Response.json(
      {
        error: "PRO_REQUIRED",
        message: "This faction lives in the PRO UNLIMITED ZONE. Activate Pro to dispatch.",
        upgradeUrl: "/#pro",
        faction: faction.slug,
      },
      { status: 402 }
    );
  }

  // YT PRO scales with requested length (tiered); others use flat faction cost
  const baseCost = baseCostFor(faction.slug, faction.group, faction.cost, targetDuration ?? undefined);
  const totalCost = baseCost + (gpu ? gpuCost : 0);
  const tier = faction.slug === "yt-pro" && targetDuration ? ytTierFor(targetDuration) : null;

  if (totalCost > 0) {
    if (user.credits < totalCost) {
      return Response.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: gpu
            ? `GPU TURBO needs ${totalCost} CR (base ${baseCost}${tier ? ` · ${tier.name}` : ""} + GPU ${gpuCost}) — balance is ${user.credits} CR. Buy credits to go fast.`
            : `Need ${totalCost} CR${tier ? ` (${tier.name} ${tier.badge})` : ""} — balance is ${user.credits} CR.`,
          balance: user.credits,
          cost: totalCost,
          baseCost,
          gpu,
          gpuCost,
          tier: tier?.id ?? null,
          targetDuration,
        },
        { status: 402 }
      );
    }
    // atomic guarded decrement — only succeeds if balance still covers total
    const updated = await db
      .update(users)
      .set({ credits: sql`${users.credits} - ${totalCost}`, updatedAt: new Date() })
      .where(and(eq(users.id, user.id), sql`${users.credits} >= ${totalCost}`))
      .returning({ credits: users.credits });
    if (!updated[0]) {
      const fresh = await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1);
      return Response.json(
        { error: "INSUFFICIENT_CREDITS", message: "Balance changed during dispatch. Buy credits and retry.", balance: fresh[0]?.credits ?? 0, cost: totalCost, gpu, gpuCost },
        { status: 402 }
      );
    }
  }

  const enriched: Record<string, unknown> = {
    ...input,
    gpu,
    renderMode: gpu ? "gpu" : "cpu",
    gpuCost: gpu ? gpuCost : 0,
    aspect,
    overlayPrefs: input.overlayPrefs ? sanitizePrefs(input.overlayPrefs) : undefined,
    hasLogo: Boolean(input.hasLogo),
    ...(targetDuration ? { targetDuration, targetLabel: fmtDuration(targetDuration) } : {}),
    ...(tier ? { tier: tier.id, tierName: tier.name } : {}),
    fileName: (input.fileName as string) || (input.videoFileName as string) || (input.audioFileName as string) || (input.documentFileName as string) || `${faction.slug}-ingest-${Date.now()}.mp4`,
    dispatchedAt: new Date().toISOString(),
  };

  const inserted = await db
    .insert(tasks)
    .values({
      userId: user.id,
      faction: faction.slug,
      status: "queued",
      progress: 4,
      cost: totalCost,
      inputPayload: enriched,
      resultPayload: {},
      lane: gpu ? "gpu" : "cpu",
      runner: gpu ? "colab" : "vps",
      stage: gpu ? "WAITING FOR T4" : "",
    })
    .returning();

  const task = inserted[0];

  // GPU TURBO → hand off to a Google Colab (Free T4) node
  let dispatch: { queued: boolean; workerId: string | null; woke: boolean } | null = null;
  if (gpu) dispatch = await enqueueGpuJob(task.id);

  return Response.json(
    {
      task_id: task.id,
      taskId: task.id,
      status: "queued",
      faction: faction.slug,
      cost: task.cost,
      baseCost,
      gpu,
      gpuCost: gpu ? gpuCost : 0,
      lane: gpu ? "GPU-TURBO" : "CPU-FORGE",
      runner: gpu ? "colab" : "vps",
      gpuNode: dispatch?.workerId ?? null,
      gpuWoke: dispatch?.woke ?? false,
      aspect,
      finalAspect: buildCropPlan(aspect, input.overlayPrefs ? sanitizePrefs(input.overlayPrefs).org : true).finalAspect,
      targetDuration,
      targetLabel: targetDuration ? fmtDuration(targetDuration) : null,
      tier: tier?.id ?? null,
      poll: `/api/v1/tasks/${task.id}`,
      message: gpu
        ? `${faction.name} queued on GPU-TURBO lane (~2.4× faster, ${totalCost} CR${targetDuration ? ` · ${fmtDuration(targetDuration)} · ${aspect}` : ""}).`
        : `${faction.name} queued${targetDuration ? ` · ${fmtDuration(targetDuration)} · ${aspect}` : ""}.`,
    },
    { status: 202 }
  );
}

// Flask parity: allow GET on faction route to describe contract
export async function GET(req: Request, ctx: { params: Promise<{ faction: string }> }) {
  const { faction: slug } = await ctx.params;
  const faction = getFaction(slug);
  if (!faction) return Response.json({ error: "Unknown faction" }, { status: 404 });
  const spec = durationSpec(faction.slug);
  return Response.json({
    faction,
    gpuCost: gpuCostFor(faction.slug),
    gpuSpeedup: "2.4×",
    lane: ["CPU-FORGE", "GPU-TURBO"],
    duration: spec ? { ...spec, maxLabel: fmtDuration(spec.max) } : null,
    aspects: ASPECT_RATIOS.map((a) => a.id),
  });
}
