// MOCK DATA — placeholder until the FastAPI backend is connected.
export type JobStatus = "PENDING" | "QUEUED" | "ASSIGNED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type WorkerState = "ONLINE" | "DRAINING" | "OFFLINE";
export type GpuHealth = "HEALTHY" | "DEGRADED" | "DEAD";

export interface Job {
  id: string;
  name: string;
  user: string;
  priority: number;
  status: JobStatus;
  submitted: string;
}

export const queueJobs: Job[] = [
  { id: "JOB-001", name: "train_resnet.py", user: "alice@univ.edu", priority: 4, status: "QUEUED", submitted: "2 min ago" },
  { id: "JOB-002", name: "bert_finetune.py", user: "bob@univ.edu", priority: 2, status: "RUNNING", submitted: "15 min ago" },
  { id: "JOB-003", name: "gan_experiment.py", user: "carol@univ.edu", priority: 5, status: "COMPLETED", submitted: "1 hour ago" },
];

export const historyJobs: Job[] = [
  { id: "JOB-003", name: "gan_experiment.py", user: "carol@univ.edu", priority: 5, status: "COMPLETED", submitted: "1 hour ago" },
  { id: "JOB-000", name: "yolo_detect.py", user: "dave@univ.edu", priority: 1, status: "FAILED", submitted: "2 hours ago" },
  { id: "JOB-099", name: "lstm_forecast.py", user: "erin@univ.edu", priority: 3, status: "CANCELLED", submitted: "3 hours ago" },
  { id: "JOB-098", name: "vit_pretrain.py", user: "alice@univ.edu", priority: 4, status: "COMPLETED", submitted: "5 hours ago" },
];

export interface Worker {
  id: string;
  host: string;
  state: WorkerState;
  gpus: { name: string; health: GpuHealth; util: number; freeVram: number; totalVram: number }[];
  heartbeat: string;
}

export const workers: Worker[] = [
  { id: "W-01", host: "lab-gpu-01", state: "ONLINE", heartbeat: "3s ago", gpus: [
    { name: "RTX 4090 #0", health: "HEALTHY", util: 92, freeVram: 4, totalVram: 24 },
    { name: "RTX 4090 #1", health: "HEALTHY", util: 81, freeVram: 9, totalVram: 24 } ] },
  { id: "W-02", host: "lab-gpu-02", state: "ONLINE", heartbeat: "5s ago", gpus: [
    { name: "A100 #0", health: "HEALTHY", util: 74, freeVram: 22, totalVram: 40 } ] },
  { id: "W-03", host: "lab-gpu-03", state: "DRAINING", heartbeat: "8s ago", gpus: [
    { name: "RTX 3090 #0", health: "DEGRADED", util: 65, freeVram: 12, totalVram: 24 } ] },
  { id: "W-04", host: "lab-gpu-04", state: "OFFLINE", heartbeat: "4 min ago", gpus: [
    { name: "RTX 3080 #0", health: "DEAD", util: 0, freeVram: 0, totalVram: 10 } ] },
];

export const stats = { totalJobs: 124, activeWorkers: 8, totalWorkers: 10, avgGpuUtil: 78, queueLength: 23 };

export const PURPOSE =
  "Fairlane: A fair & fault-tolerant scheduler for distributed ML workloads in shared GPU environments. Designed for students, researchers, and lab administrators to orchestrate GPU jobs without enterprise complexity.";
