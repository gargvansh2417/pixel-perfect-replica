// Client-side MOCK job store with a simulated scheduler. Replace with FastAPI calls later.
import { useSyncExternalStore } from "react";
import type { JobStatus } from "./sample-data";

export type EventKind = "SUBMITTED" | "QUEUED" | "ASSIGNED" | "STARTED" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface JobEvent { t: number; kind: EventKind; text: string }
export interface ResultFile { name: string; size: string }

export interface FullJob {
  id: string;
  name: string;
  scriptPath: string;
  user: string;
  gpus: number;
  memoryMb: number | null;
  priority: number;
  timeoutMin: number | null;
  status: JobStatus;
  submittedAt: number;
  startedAt: number | null;
  endedAt: number | null;
  worker: string | null;
  retryCount: number;
  maxRetries: number;
  events: JobEvent[];
  logs: string[];
  results: ResultFile[];
  simulated?: boolean;
}

const MIN = 60_000;
const users = ["alice@univ.edu", "bob@univ.edu", "carol@univ.edu", "dave@univ.edu", "erin@univ.edu", "frank@univ.edu"];
const scripts = ["train_resnet.py", "bert_finetune.py", "gan_experiment.py", "yolo_detect.py", "lstm_forecast.py", "vit_pretrain.py", "diffusion_sample.py", "rl_ppo_atari.py"];
const workersList = ["worker-gpu-01", "worker-gpu-02", "worker-gpu-03", "worker-gpu-04"];
const RESULTS: ResultFile[] = [
  { name: "output.log", size: "1.2 MB" },
  { name: "model.pth", size: "94.6 MB" },
  { name: "metrics.json", size: "4 KB" },
];

export function fmtClock(t: number) {
  const d = new Date(t);
  return d.toTimeString().slice(0, 8);
}
function stamp(t: number) {
  const d = new Date(t);
  return `${d.toISOString().slice(0, 10)} ${fmtClock(t)}`;
}

function buildJob(i: number, status: JobStatus, now: number): FullJob {
  const user = users[i % users.length]!;
  const name = scripts[i % scripts.length]!;
  const submittedAt = now - (i * 17 + 3) * MIN;
  const priority = [4, 2, 5, 1, 3, 3, 4, 2][i % 8]!;
  const worker = workersList[i % workersList.length]!;
  const reached = ["PENDING", "QUEUED", "ASSIGNED", "RUNNING", "COMPLETED"];
  const idx = status === "FAILED" ? 3 : status === "CANCELLED" ? 1 : reached.indexOf(status);
  const events: JobEvent[] = [{ t: submittedAt, kind: "SUBMITTED", text: `Job submitted by ${user}` }];
  const logs: string[] = [];
  let startedAt: number | null = null;
  let endedAt: number | null = null;
  if (idx >= 1) events.push({ t: submittedAt + 4000, kind: "QUEUED", text: `Job queued (priority ${priority})` });
  if (idx >= 2) events.push({ t: submittedAt + 5 * MIN, kind: "ASSIGNED", text: `Job assigned to ${worker}` });
  if (idx >= 3) {
    startedAt = submittedAt + 5 * MIN + 3000;
    events.push({ t: startedAt, kind: "STARTED", text: "Job started execution" });
    logs.push(`[${stamp(startedAt)}] Starting job execution...`, `[${stamp(startedAt + 4000)}] Loading dataset...`);
    for (let e = 1; e <= 4; e++) logs.push(`[${stamp(startedAt + e * 5 * MIN)}] Epoch ${e}/10: loss=${(0.5 - e * 0.06).toFixed(2)}`);
  }
  if (status === "COMPLETED") {
    endedAt = (startedAt ?? submittedAt) + 45 * MIN;
    logs.push(`[${stamp(endedAt)}] Training finished. Saved model.pth`);
    events.push({ t: endedAt, kind: "COMPLETED", text: "Job completed successfully" });
  }
  if (status === "FAILED") {
    endedAt = (startedAt ?? submittedAt) + 22 * MIN;
    logs.push(
      `[${stamp(endedAt)}] Traceback (most recent call last):`,
      `  File "${name}", line 88, in train_step`,
      "    loss.backward()",
      "torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB",
    );
    events.push({ t: endedAt, kind: "FAILED", text: "Job failed: CUDA out of memory" });
  }
  if (status === "CANCELLED") {
    endedAt = submittedAt + 2 * MIN;
    events.push({ t: endedAt, kind: "CANCELLED", text: `Job cancelled by ${user}` });
  }
  return {
    id: `JOB-${String(130 - i).padStart(3, "0")}`,
    name,
    scriptPath: `/mnt/nfs/users/${user.split("@")[0]}/jobs/${name.replace(".py", "")}/${name}`,
    user,
    gpus: (i % 4) + 1,
    memoryMb: i % 3 === 0 ? null : 8192 * ((i % 2) + 1),
    priority,
    timeoutMin: i % 2 ? 120 : null,
    status,
    submittedAt,
    startedAt,
    endedAt,
    worker: idx >= 2 ? worker : null,
    retryCount: status === "FAILED" ? i % 4 : 0,
    maxRetries: 3,
    events,
    logs,
    results: status === "COMPLETED" ? RESULTS : [],
  };
}

const seedStatuses: JobStatus[] = [
  "PENDING", "QUEUED", "RUNNING", "ASSIGNED", "COMPLETED", "FAILED", "QUEUED", "RUNNING", "COMPLETED", "CANCELLED",
  "COMPLETED", "QUEUED", "FAILED", "COMPLETED", "RUNNING", "COMPLETED", "QUEUED", "COMPLETED", "CANCELLED", "COMPLETED",
  "FAILED", "COMPLETED", "COMPLETED", "QUEUED", "COMPLETED", "COMPLETED",
];

let jobs: FullJob[] = seedStatuses.map((s, i) => buildJob(i, s, Date.now()));
let nextId = 131;
const listeners = new Set<() => void>();
function set(next: FullJob[]) {
  jobs = next;
  listeners.forEach((l) => l());
}
function patch(id: string, fn: (j: FullJob) => FullJob) {
  set(jobs.map((j) => (j.id === id ? fn(j) : j)));
}

export function useJobs() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      startSimulation();
      return () => listeners.delete(l);
    },
    () => jobs,
    () => jobs,
  );
}
export function useJob(id: string) {
  return useJobs().find((j) => j.id === id);
}

export interface NewJobInput {
  name: string;
  scriptPath: string;
  gpus: number;
  memoryMb: number | null;
  priority: number;
  timeoutMin: number | null;
}

export async function submitJob(input: NewJobInput): Promise<FullJob> {
  await new Promise((r) => setTimeout(r, 900));
  const now = Date.now();
  const job: FullJob = {
    ...input,
    id: `JOB-${nextId++}`,
    user: "vansh@univ.edu",
    status: "PENDING",
    submittedAt: now,
    startedAt: null,
    endedAt: null,
    worker: null,
    retryCount: 0,
    maxRetries: 3,
    events: [{ t: now, kind: "SUBMITTED", text: "Job submitted by vansh@univ.edu" }],
    logs: [],
    results: [],
    simulated: true,
  };
  set([job, ...jobs]);
  return job;
}

export function cancelJob(id: string) {
  const t = Date.now();
  patch(id, (j) => ({
    ...j,
    status: "CANCELLED",
    endedAt: t,
    simulated: false,
    events: [...j.events, { t, kind: "CANCELLED", text: `Job cancelled by ${j.user}` }],
  }));
}

export function retryJob(id: string) {
  const t = Date.now();
  patch(id, (j) => ({
    ...j,
    status: "PENDING",
    retryCount: j.retryCount + 1,
    startedAt: null,
    endedAt: null,
    worker: null,
    logs: [],
    simulated: true,
    events: [...j.events, { t, kind: "SUBMITTED", text: `Retry ${j.retryCount + 1}/${j.maxRetries} requested` }],
  }));
}

export function clearLogs(id: string) {
  patch(id, (j) => ({ ...j, logs: [] }));
}

// Simulated scheduler: advances user-submitted jobs through the lifecycle.
const STEP_MS = 6000;
let started = false;
function startSimulation() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.setInterval(() => {
    const t = Date.now();
    let changed = false;
    const next = jobs.map((j) => {
      if (!j.simulated) return j;
      changed = true;
      switch (j.status) {
        case "PENDING":
          return { ...j, status: "QUEUED" as const, events: [...j.events, { t, kind: "QUEUED" as const, text: `Job queued (priority ${j.priority})` }] };
        case "QUEUED":
          return { ...j, status: "ASSIGNED" as const, worker: "worker-gpu-03", events: [...j.events, { t, kind: "ASSIGNED" as const, text: "Job assigned to worker-gpu-03" }] };
        case "ASSIGNED":
          return {
            ...j,
            status: "RUNNING" as const,
            startedAt: t,
            events: [...j.events, { t, kind: "STARTED" as const, text: "Job started execution" }],
            logs: [`[${stamp(t)}] Starting job execution...`, `[${stamp(t)}] CUDA_VISIBLE_DEVICES=0,1`, `[${stamp(t + 1000)}] Loading dataset...`],
          };
        case "RUNNING": {
          const epoch = j.logs.filter((l) => l.includes("Epoch")).length + 1;
          if (epoch > 5) {
            return {
              ...j,
              status: "COMPLETED" as const,
              endedAt: t,
              simulated: false,
              results: RESULTS,
              logs: [...j.logs, `[${stamp(t)}] Training finished. Saved model.pth`],
              events: [...j.events, { t, kind: "COMPLETED" as const, text: "Job completed successfully" }],
            };
          }
          return { ...j, logs: [...j.logs, `[${stamp(t)}] Epoch ${epoch}/5: loss=${(0.5 - epoch * 0.07).toFixed(2)}`] };
        }
        default:
          return { ...j, simulated: false };
      }
    });
    if (changed) set(next);
  }, STEP_MS);
}

export function relTime(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function duration(a: number, b: number) {
  const s = Math.max(0, Math.round((b - a) / 1000));
  const m = Math.floor(s / 60);
  if (m >= 60) return `${Math.floor(m / 60)} hr ${m % 60} min`;
  return `${m} min ${s % 60}s`;
}
