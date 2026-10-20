import { claimNextGpuJob, touchWorker, verifySignature } from "@/lib/gpu-worker";
import { getFaction } from "@/lib/factions";

export const dynamic = "force-dynamic";

/** Colab long-polls this to pull the next GPU TURBO job. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-cutflow-signature"))) {
    return Response.json({ error: "BAD_SIGNATURE" }, { status: 401 });
  }
  let b: { workerId?: string } = {};
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "BAD_JSON" }, { status: 400 }); }
  const workerId = (b.workerId || "").toString().slice(0, 64);
  if (!workerId) return Response.json({ error: "NO_WORKER_ID" }, { status: 400 });

  await touchWorker(workerId, { status: "idle" });

  const task = await claimNextGpuJob(workerId);
  if (!task) return Response.json({ job: null, sleepMs: 4000 });

  await touchWorker(workerId, { status: "busy", activeTaskId: task.id });
  const faction = getFaction(task.faction);
  const input = (task.inputPayload ?? {}) as Record<string, unknown>;

  return Response.json({
    job: {
      taskId: task.id,
      faction: task.faction,
      factionName: faction?.name ?? task.faction,
      aspect: (input.aspect as string) ?? "16:9",
      targetDuration: (input.targetDuration as number) ?? null,
      gpu: true,
      input,
      // what the notebook should actually render
      pipeline: faction?.hudKind ?? "generic",
      createdAt: task.createdAt,
    },
  });
}
