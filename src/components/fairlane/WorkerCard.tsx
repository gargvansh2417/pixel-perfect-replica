import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { clampPct, fmtUptime, hasSample, tempTone, usageTone, type Metric, type Tone, type WorkerTelemetry } from "@/lib/worker-telemetry";
import { btn } from "./buttons";

export type WorkerAction = "Drain" | "Resume" | "Retire";

const fill: Record<Tone, string> = { secondary: "bg-secondary", warning: "bg-warning", error: "bg-error" };
const stateBadge = {
  ONLINE: "bg-secondary/20 text-secondary",
  DRAINING: "bg-warning/20 text-warning",
  OFFLINE: "bg-muted-foreground/20 text-muted-foreground",
} as const;
const agent = {
  ONLINE: { dot: "bg-secondary", text: "text-secondary", label: "Connected" },
  DRAINING: { dot: "bg-warning", text: "text-warning", label: "Draining jobs" },
  OFFLINE: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Disconnected" },
} as const;

function Tip({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-background/90 px-2 py-1 text-caption font-medium text-foreground">{tip}</TooltipContent>
    </Tooltip>
  );
}

function Val({ m, children }: { m: Metric<unknown>; children: React.ReactNode }) {
  return (
    <span className={`font-semibold ${m.sample ? "text-muted-foreground" : "text-foreground"}`}>
      {children}
      {m.sample && (
        <Tip tip="Sample data - does not reflect actual GPU state">
          <sup className="ml-0.5 cursor-help text-caption text-warning">*</sup>
        </Tip>
      )}
    </span>
  );
}

function MetricRow({ label, tip, m, text, pct, tone }: { label: string; tip: string; m: Metric<unknown>; text: string; pct?: number; tone?: Tone }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Tip tip={tip}><span className="cursor-help text-label text-subtle-foreground">{label}</span></Tip>
        <Val m={m}>{text}</Val>
      </div>
      {pct !== undefined && tone && (
        <Tip tip={tip}>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-surface">
            <div className={`h-2.5 transition-all duration-300 ${fill[tone]}`} style={{ width: `${clampPct(pct)}%` }} />
          </div>
        </Tip>
      )}
    </div>
  );
}

export function WorkerCard({ w, onAction }: { w: WorkerTelemetry; onAction: (a: WorkerAction) => void }) {
  const sample = hasSample(w);
  const vramPct = (w.vram.value.used / w.vram.value.total) * 100;
  const a = agent[w.state];
  const action = w.state === "ONLINE"
    ? { label: "Drain Worker", act: "Drain" as const, v: "warning" as const, tip: "Stop accepting new jobs; allow current to finish" }
    : w.state === "DRAINING"
      ? { label: "Resume Worker", act: "Resume" as const, v: "secondary" as const, tip: "Return to normal operation after draining" }
      : { label: "Retire Worker", act: "Retire" as const, v: "error" as const, tip: "Permanently remove this worker from the cluster" };

  return (
    <div className={`flex min-h-96 flex-col rounded-lg border bg-card/50 p-6 shadow-sm transition-colors duration-200 hover:bg-card hover:shadow-md ${sample ? "border-dashed border-input" : "border-border"}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Tip tip="Unique identifier for this worker node">
          <span className="cursor-help break-all font-mono text-lg font-semibold text-foreground">{w.hostname}</span>
        </Tip>
        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-label ${stateBadge[w.state]}`}>{w.state}</span>
      </div>

      <div className="space-y-3">
        <MetricRow label="GPU Usage" tip="Percentage of GPU compute cores in use" m={w.gpuUtil} text={`${w.gpuUtil.value.toFixed(1)}%`} pct={w.gpuUtil.value} tone={usageTone(w.gpuUtil.value)} />
        <MetricRow label="VRAM" tip="Graphics memory allocated vs total available" m={w.vram} text={`${w.vram.value.used.toFixed(1)}/${w.vram.value.total.toFixed(1)} GB`} pct={vramPct} tone={usageTone(vramPct)} />
        <MetricRow label="Temp" tip="Current GPU die temperature (safe <85°C)" m={w.temp} text={`${w.temp.value.toFixed(1)}°C`} pct={w.temp.value} tone={tempTone(w.temp.value)} />
        {w.power && <MetricRow label="Power" tip="Electrical power consumption" m={w.power} text={`${w.power.value}W`} />}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <Tip tip="Fairlane worker agent connection state">
          <div className="flex cursor-help items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${a.dot}`} />
            <span className="text-caption font-medium text-subtle-foreground">Agent Status</span>
            <span className={`text-label ${a.text}`}>{a.label}</span>
          </div>
        </Tip>
        <Tip tip="Number of jobs currently executing on this node">
          <div className="flex cursor-help items-center space-x-2 text-label">
            <span className="text-subtle-foreground">Active Jobs</span>
            <Val m={w.activeJobs}>{w.activeJobs.value}/{w.maxConcurrent}</Val>
          </div>
        </Tip>
        <Tip tip="Time since last agent restart">
          <div className="flex cursor-help items-center space-x-2 text-label">
            <span className="text-subtle-foreground">Uptime</span>
            <Val m={w.uptimeHours}>{fmtUptime(w.uptimeHours.value)}</Val>
          </div>
        </Tip>
      </div>

      <div className="mt-auto flex justify-between gap-2 border-t border-border pt-4">
        <Tip tip={action.tip}>
          <button className={btn(action.v, "xs")} onClick={() => onAction(action.act)}>{action.label}</button>
        </Tip>
        {w.state === "OFFLINE" ? (
          <button className={btn("primary", "xs")} disabled>View Details</button>
        ) : (
          <Link to="/workers/$hostname" params={{ hostname: w.hostname }} className={btn("primary", "xs")}>View Details</Link>
        )}
      </div>
    </div>
  );
}
