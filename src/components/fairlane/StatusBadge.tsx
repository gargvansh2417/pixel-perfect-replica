import { cn } from "@/lib/utils";
import type { JobStatus, WorkerState, GpuHealth } from "@/lib/sample-data";

const map: Record<string, string> = {
  QUEUED: "bg-status-queued text-status-queued-fg",
  PENDING: "bg-status-queued text-status-queued-fg",
  ASSIGNED: "bg-status-running text-status-running-fg",
  RUNNING: "bg-status-running text-status-running-fg",
  COMPLETED: "bg-status-completed text-status-completed-fg",
  FAILED: "bg-status-failed text-status-failed-fg",
  CANCELLED: "bg-status-cancelled text-status-cancelled-fg",
  ONLINE: "bg-status-completed text-status-completed-fg",
  HEALTHY: "bg-status-completed text-status-completed-fg",
  DRAINING: "bg-status-queued text-status-queued-fg",
  DEGRADED: "bg-status-queued text-status-queued-fg",
  OFFLINE: "bg-status-cancelled text-status-cancelled-fg",
  DEAD: "bg-status-failed text-status-failed-fg",
};

export function StatusBadge({ status }: { status: JobStatus | WorkerState | GpuHealth }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-caption font-semibold tracking-wide", map[status])}>
      {status}
    </span>
  );
}
