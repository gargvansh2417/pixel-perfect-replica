import { cn } from "@/lib/utils";
import type { JobStatus, WorkerState, GpuHealth } from "@/lib/sample-data";

const map: Record<string, string> = {
  QUEUED: "bg-status-queued text-status-queued-fg",
  PENDING: "bg-status-pending text-status-pending-fg",
  ASSIGNED: "bg-status-assigned text-status-assigned-fg",
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

export function StatusBadge({ status, size = "sm" }: { status: JobStatus | WorkerState | GpuHealth; size?: "sm" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center font-semibold tracking-wide", size === "lg" ? "rounded-md px-4 py-2 text-base" : "rounded px-2 py-0.5 text-caption", map[status])}>
      {status}
    </span>
  );
}

const prio: Record<number, string> = {
  1: "bg-prio-1 text-prio-1-fg",
  2: "bg-prio-2 text-prio-2-fg",
  3: "bg-prio-3 text-prio-3-fg",
  4: "bg-prio-4 text-prio-4-fg",
  5: "bg-prio-5 text-prio-5-fg",
};
export const prioClass = prio;

export function PriorityBadge({ priority }: { priority: number }) {
  return <span className={cn("inline-flex rounded px-2 py-0.5 text-caption font-semibold", prio[priority])}>{priority}</span>;
}
