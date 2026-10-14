// MOCK worker telemetry — SAMPLE DATA ONLY. No worker agents are connected.
// Values are deliberately round (e.g. 50.0%, 65.0°C) so they never look live.
import type { WorkerState } from "./sample-data";

export interface Metric<T> { value: T; sample: boolean }

export interface WorkerTelemetry {
  hostname: string;
  state: WorkerState;
  gpuUtil: Metric<number>; // %
  vram: Metric<{ used: number; total: number }>; // GB
  temp: Metric<number>; // °C
  power: Metric<number> | null; // W
  activeJobs: Metric<number>;
  maxConcurrent: number;
  uptimeHours: Metric<number>;
}

const s = <T,>(value: T): Metric<T> => ({ value, sample: true });

export const sampleWorkers: WorkerTelemetry[] = [
  { hostname: "worker-gpu-01", state: "ONLINE", gpuUtil: s(25.0), vram: s({ used: 4.0, total: 24.0 }), temp: s(55.0), power: s(150), activeJobs: s(1), maxConcurrent: 2, uptimeHours: s(86) },
  { hostname: "worker-gpu-02", state: "ONLINE", gpuUtil: s(90.0), vram: s({ used: 36.0, total: 40.0 }), temp: s(88.0), power: s(300), activeJobs: s(2), maxConcurrent: 2, uptimeHours: s(170) },
  { hostname: "worker-gpu-03", state: "OFFLINE", gpuUtil: s(0), vram: s({ used: 0, total: 24.0 }), temp: s(0), power: null, activeJobs: s(0), maxConcurrent: 2, uptimeHours: s(0) },
  { hostname: "worker-gpu-04", state: "DRAINING", gpuUtil: s(50.0), vram: s({ used: 6.0, total: 10.0 }), temp: s(75.0), power: s(220), activeJobs: s(1), maxConcurrent: 2, uptimeHours: s(14) },
];

export type Tone = "secondary" | "warning" | "error";

/** GPU / VRAM bar: <50 green, 50–80 amber, >80 red. */
export function usageTone(pct: number): Tone {
  if (pct < 50) return "secondary";
  if (pct <= 80) return "warning";
  return "error";
}

/** Temperature bar: <70 green, 70–85 amber, >85 red. */
export function tempTone(c: number): Tone {
  if (c < 70) return "secondary";
  if (c <= 85) return "warning";
  return "error";
}

export const clampPct = (n: number) => Math.min(Math.max(n, 0), 100);

export function fmtUptime(h: number) {
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function hasSample(w: WorkerTelemetry) {
  return [w.gpuUtil, w.vram, w.temp, w.power, w.activeJobs, w.uptimeHours].some((m) => m?.sample);
}

/** Show the page banner when at least half of cards contain sample data. */
export function showSampleBanner(ws: WorkerTelemetry[]) {
  return ws.length > 0 && ws.filter(hasSample).length / ws.length >= 0.5;
}
