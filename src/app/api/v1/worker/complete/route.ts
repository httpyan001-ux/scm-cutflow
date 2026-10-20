import { db } from "@/db";
import { tasks } from "@/db/schema";
import { bumpWorkerDone, verifySignature } from "@/lib/gpu-worker";
import { buildResult } from "@/lib/server";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Colab posts the finished render (or an error) here. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-cutflow-signature"))) {
    return Response.json({ error: "BAD_SIGNATURE" }, { status: 401 });
  }
  let b: { workerId?: string; taskId?: string; ok?: boolean; result?: Record<string, unknown>; error?: string; gpuName?: string; renderSeconds?: number } = {};
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "BAD_JSON" }, { status: 400 }); }

  const workerId = (b.workerId || "").toString().slice(0, 64);
  const taskId = (b.taskId || "").toString();
  if (!workerId || !taskId) return Response.json({ error: "MISSING" }, { status: 400 });

  const rows = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.workerId, workerId))).limit(1);
  const t = rows[0];
  if (!t) return Response.json({ error: "NOT_YOURS" }, { status: 409 });
  if (t.status === "completed") return Response.json({ ok: true, alreadyDone: true });

  const now = new Date();

  if (b.ok === false) {
    // Worker failed → hand back to the VPS lane so the user still gets output.
    await db
      .update(tasks)
      .set({ runner: "vps", workerId: null, stage: "VPS FALLBACK", error: (b.error || "worker error").slice(0, 300), heartbeatAt: null, updatedAt: now })
      .where(eq(tasks.id, taskId));
    await bumpWorkerDone(workerId);
    return Response.json({ ok: true, requeuedTo: "vps" });
  }

  // Keep any payload the server pre-computed (e.g. KNOWLEDGE script/caption),
  // then overlay whatever the GPU node produced.
  const pre = (t.resultPayload ?? {}) as Record<string, unknown>;
  const base = Object.keys(pre).length ? pre : buildResult(t.faction, (t.inputPayload ?? {}) as Record<string, unknown>);
  const result = {
    ...base,
    ...(b.result ?? {}),
    gpu: true,
    renderLane: "GPU-TURBO",
    runner: "colab",
    accelerator: (b.gpuName || "Tesla T4").toString().slice(0, 40),
    renderSeconds: Number(b.renderSeconds) || undefined,
  };

  await db
    .update(tasks)
    .set({ status: "completed", progress: 100, stage: "SEALED", resultPayload: result, heartbeatAt: now, updatedAt: now })
    .where(eq(tasks.id, taskId));
  await bumpWorkerDone(workerId);

  return Response.json({ ok: true, taskId, sealed: true });
}
