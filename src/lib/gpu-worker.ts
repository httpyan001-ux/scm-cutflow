import "server-only";
import crypto from "node:crypto";
import { db } from "@/db";
import { tasks, workers } from "@/db/schema";
import { and, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";

/**
 * ============================================================
 * GPU TURBO ROUTING
 *   normal  →  rendered on this VPS (simulated CPU lane)
 *   turbo   →  handed to a Google Colab (Free T4) worker
 * ============================================================
 *
 * Colab has no stable inbound address, so the protocol is HYBRID:
 *   1. PUSH  — if the notebook registered a tunnel URL (cloudflared/ngrok)
 *              we "wake" it instantly with a signed POST.
 *   2. PULL  — the notebook also long-polls /api/v1/worker/claim,
 *              so it still works with zero tunneling.
 *   3. FALLBACK — if no worker claims the job within GPU_CLAIM_TIMEOUT,
 *              the VPS finishes it locally so the user is never stuck.
 */

export const WORKER_ONLINE_MS = 90_000;    // heartbeat freshness
export const GPU_CLAIM_TIMEOUT_MS = 45_000; // wait before VPS takes over
export const WORKER_LEASE_MS = 120_000;     // dead-worker reclaim window

function secret(): string {
  return process.env.GPU_WORKER_SECRET || "cutflow-dev-secret-change-me";
}

/** HMAC of the raw body — Colab signs every callback with this. */
export function signBody(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("hex");
}

export function verifySignature(body: string, header: string | null): boolean {
  if (!header) return false;
  const expected = signBody(body);
  const a = Buffer.from(expected);
  const b = Buffer.from(header.trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface WorkerRow {
  id: string;
  kind: string;
  gpuName: string;
  callbackUrl: string;
  status: string;
  activeTaskId: string | null;
  jobsDone: number;
  lastSeenAt: Date;
}

/** Workers that sent a heartbeat recently. */
export async function onlineWorkers(): Promise<WorkerRow[]> {
  const since = new Date(Date.now() - WORKER_ONLINE_MS);
  const rows = await db
    .select()
    .from(workers)
    .where(gt(workers.lastSeenAt, since))
    .orderBy(desc(workers.lastSeenAt));
  return rows as unknown as WorkerRow[];
}

export async function pickIdleWorker(): Promise<WorkerRow | null> {
  const list = await onlineWorkers();
  return list.find((w) => w.status === "idle") ?? list[0] ?? null;
}

/**
 * Fire-and-forget wake ping to a registered Colab tunnel.
 * Never throws — pull mode is always the safety net.
 */
export async function wakeWorker(worker: WorkerRow, taskId: string): Promise<boolean> {
  if (!worker.callbackUrl) return false;
  try {
    const body = JSON.stringify({ event: "job.available", taskId, at: Date.now() });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`${worker.callbackUrl.replace(/\/+$/, "")}/wake`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "X-Cutflow-Signature": signBody(body) },
      body,
    });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

/** Mark a GPU job as waiting for a Colab node and try to wake one. */
export async function enqueueGpuJob(taskId: string): Promise<{ queued: boolean; workerId: string | null; woke: boolean }> {
  const worker = await pickIdleWorker();
  await db
    .update(tasks)
    .set({ lane: "gpu", runner: "colab", stage: "WAITING FOR T4", updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
  if (!worker) return { queued: true, workerId: null, woke: false };
  const woke = await wakeWorker(worker, taskId);
  return { queued: true, workerId: worker.id, woke };
}

/**
 * Atomically hand the oldest unclaimed GPU job to a worker.
 * Also reclaims jobs whose worker died mid-render.
 */
export async function claimNextGpuJob(workerId: string) {
  const staleBefore = new Date(Date.now() - WORKER_LEASE_MS);
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.lane, "gpu"),
        eq(tasks.runner, "colab"),
        or(eq(tasks.status, "queued"), eq(tasks.status, "processing")),
        or(isNull(tasks.workerId), lt(tasks.heartbeatAt, staleBefore))
      )
    )
    .orderBy(tasks.createdAt)
    .limit(1);

  const target = rows[0];
  if (!target) return null;

  const now = new Date();
  const claimed = await db
    .update(tasks)
    .set({ workerId, claimedAt: now, heartbeatAt: now, status: "processing", stage: "CLAIMED BY T4", updatedAt: now })
    .where(
      and(
        eq(tasks.id, target.id),
        or(isNull(tasks.workerId), lt(tasks.heartbeatAt, staleBefore), eq(tasks.workerId, workerId))
      )
    )
    .returning();

  return claimed[0] ?? null;
}

/** True when a Colab worker is actively driving this task. */
export function workerIsLive(t: { runner: string; workerId: string | null; heartbeatAt: Date | null }): boolean {
  if (t.runner !== "colab" || !t.workerId || !t.heartbeatAt) return false;
  return Date.now() - new Date(t.heartbeatAt).getTime() < WORKER_LEASE_MS;
}

/** True when nobody picked the GPU job up in time → VPS should finish it. */
export function shouldFallbackToVps(t: {
  runner: string;
  workerId: string | null;
  heartbeatAt: Date | null;
  createdAt: Date;
}): boolean {
  if (t.runner !== "colab") return false;
  if (workerIsLive(t)) return false;
  const age = Date.now() - new Date(t.createdAt).getTime();
  return age > GPU_CLAIM_TIMEOUT_MS;
}

export async function touchWorker(id: string, patch: Partial<{ status: string; activeTaskId: string | null; callbackUrl: string; gpuName: string }> = {}) {
  await db
    .update(workers)
    .set({ ...patch, lastSeenAt: new Date() })
    .where(eq(workers.id, id));
}

export async function bumpWorkerDone(id: string) {
  await db
    .update(workers)
    .set({ jobsDone: sql`${workers.jobsDone} + 1`, status: "idle", activeTaskId: null, lastSeenAt: new Date() })
    .where(eq(workers.id, id));
}

export async function gpuFleetStatus() {
  const list = await onlineWorkers();
  const queued = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tasks)
    .where(and(eq(tasks.lane, "gpu"), eq(tasks.status, "queued")));
  return {
    online: list.length,
    idle: list.filter((w) => w.status === "idle").length,
    busy: list.filter((w) => w.status === "busy").length,
    gpus: list.map((w) => ({ id: w.id, gpu: w.gpuName, status: w.status, jobsDone: w.jobsDone })),
    queuedGpuJobs: Number(queued[0]?.n ?? 0),
  };
}
