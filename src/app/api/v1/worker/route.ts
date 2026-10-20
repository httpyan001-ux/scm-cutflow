import { db } from "@/db";
import { workers } from "@/db/schema";
import { gpuFleetStatus, touchWorker, verifySignature, WORKER_ONLINE_MS } from "@/lib/gpu-worker";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Colab notebook registers itself + sends heartbeats here. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-cutflow-signature"))) {
    return Response.json({ error: "BAD_SIGNATURE", message: "Worker signature invalid." }, { status: 401 });
  }
  let b: { workerId?: string; gpuName?: string; callbackUrl?: string; status?: string } = {};
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "BAD_JSON" }, { status: 400 }); }

  const id = (b.workerId || "").toString().slice(0, 64);
  if (!/^colab-[A-Za-z0-9_-]{4,}$/.test(id)) {
    return Response.json({ error: "BAD_WORKER_ID", message: "workerId must look like colab-xxxx" }, { status: 400 });
  }

  const gpuName = (b.gpuName || "T4").toString().slice(0, 40);
  const callbackUrl = (b.callbackUrl || "").toString().slice(0, 300);
  const status = ["idle", "busy", "offline"].includes(b.status || "") ? (b.status as string) : "idle";

  const existing = await db.select({ id: workers.id }).from(workers).where(eq(workers.id, id)).limit(1);
  if (existing[0]) {
    await touchWorker(id, { gpuName, callbackUrl, status });
  } else {
    await db.insert(workers).values({ id, kind: "colab", gpuName, callbackUrl, status });
  }

  return Response.json({
    ok: true,
    workerId: id,
    heartbeatEverySec: Math.floor(WORKER_ONLINE_MS / 3000),
    claimUrl: "/api/v1/worker/claim",
    progressUrl: "/api/v1/worker/progress",
    completeUrl: "/api/v1/worker/complete",
  });
}

/** Public fleet status (used by the dashboard GPU badge). */
export async function GET() {
  return Response.json(await gpuFleetStatus());
}
