// MOCK DATA for the Overview page — replace with API data later.
import type { Job } from "./sample-data";

export const jobCounts = { total: 124, queued: 23, running: 8, completed: 89, failed: 5 };

/** Colour rule for the Completed/Failed card. */
export function completedFailedTone(completed: number, failed: number): "secondary" | "error" | "warning" {
  if (completed > failed) return "secondary";
  if (failed > completed) return "error";
  return "warning";
}

export const recentJobs: Job[] = [
  { id: "JOB-001", name: "train_resnet.py", user: "alice@univ.edu", priority: 4, status: "QUEUED", submitted: "2 min ago" },
  { id: "JOB-002", name: "bert_finetune.py", user: "bob@univ.edu", priority: 2, status: "RUNNING", submitted: "15 min ago" },
  { id: "JOB-003", name: "gan_experiment.py", user: "carol@univ.edu", priority: 5, status: "COMPLETED", submitted: "1 hr ago" },
  { id: "JOB-004", name: "yolo_detect.py", user: "dave@univ.edu", priority: 1, status: "FAILED", submitted: "2 hr ago" },
  { id: "JOB-005", name: "lstm_forecast.py", user: "erin@univ.edu", priority: 3, status: "CANCELLED", submitted: "3 hr ago" },
];

export interface WorkerNode {
  host: string;
  state: "ONLINE" | "DRAINING" | "OFFLINE";
  totalGpus: number;
  availableGpus: number;
  lastSeen: string;
}

export const workerNodes: WorkerNode[] = [
  { host: "worker-gpu-01", state: "ONLINE", totalGpus: 4, availableGpus: 3, lastSeen: "Active 12s ago" },
  { host: "worker-gpu-02", state: "ONLINE", totalGpus: 4, availableGpus: 1, lastSeen: "Active 4s ago" },
  { host: "worker-gpu-03", state: "OFFLINE", totalGpus: 2, availableGpus: 0, lastSeen: "Offline 2m 14s ago" },
  { host: "worker-gpu-04", state: "DRAINING", totalGpus: 2, availableGpus: 1, lastSeen: "Active 9s ago" },
];

/** Text colour for "X/Y GPUs available". */
export function availabilityTone(available: number, total: number): "secondary" | "warning" | "error" {
  const r = total ? available / total : 0;
  if (r >= 0.7) return "secondary";
  if (r >= 0.3) return "warning";
  return "error";
}

/** Fill colour for the utilization bar (used / total %). */
export function utilizationTone(usedPct: number): "secondary" | "warning" | "error" {
  if (usedPct < 30) return "secondary";
  if (usedPct <= 70) return "warning";
  return "error";
}
