import { refreshTaskStatus } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  const task = await refreshTaskStatus(taskId);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json({
    task_id: task.id,
    taskId: task.id,
    faction: task.faction,
    status: task.status,
    progress: task.progress,
    lane: task.lane,
    runner: task.runner,
    stage: task.stage,
    workerId: task.workerId,
    workerLog: task.workerLog,
    cost: task.cost,
    input: task.inputPayload,
    result: task.resultPayload,
    error: task.error,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
}
