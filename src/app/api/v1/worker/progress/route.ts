import { db } from "@/db";
import { tasks } from "@/db/schema";
import { touchWorker, verifySignature } from "@/lib/gpu-worker";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Colab streams render progress + log lines here. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-cutflow-signature"))) {
    return Response.json({ error: "BAD_SIGNATURE" }, { status: 401 });
  }
  let b: { workerId?: string; taskId?: string; progress?: number; stage?: string; log?: string } = {};
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "BAD_JSON" }, { status: 400 }); }

  const workerId = (b.workerId || "").toString().slice(0, 64);
  const taskId = (b.taskId || "").toString();
  if (!workerId || !taskId) return Response.json({ error: "MISSING" }, { status: 400 });

  const rows = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.workerId, workerId))).limit(1);
  const t = rows[0];
  if (!t) return Response.json({ error: "NOT_YOURS", message: "Task not leased to this worker." }, { status: 409 });
  if (t.status === "completed") return Response.json({ ok: true, done: true });

  const progress = Math.max(1, Math.min(99, Math.round(Number(b.progress) || t.progress)));
  const stage = (b.stage || t.stage || "").toString().slice(0, 48);
  const prevLog = Array.isArray(t.workerLog) ? (t.workerLog as string[]) : [];
  const log = b.log ? [...prevLog, String(b.log).slice(0, 160)].slice(-12) : prevLog;

  await db
    .update(tasks)
    .set({ progress, stage, status: "processing", heartbeatAt: new Date(), workerLog: log, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
  await touchWorker(workerId, { status: "busy", activeTaskId: taskId });

  return Response.json({ ok: true, progress, stage });
}
