import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";
import { StatusBadge } from "@/components/fairlane/StatusBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  availabilityTone,
  completedFailedTone,
  jobCounts,
  recentJobs,
  utilizationTone,
  workerNodes,
} from "@/lib/overview-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Fairlane GPU Orchestration" },
      { name: "description", content: "Jobs, queue and GPU worker health at a glance for academic labs." },
      { property: "og:title", content: "Overview — Fairlane GPU Orchestration" },
      { property: "og:description", content: "Jobs, queue and GPU worker health at a glance for academic labs." },
    ],
  }),
  component: Overview,
});

const textTone = { secondary: "text-secondary", warning: "text-warning", error: "text-error" } as const;
const bgTone = { secondary: "bg-secondary", warning: "bg-warning", error: "bg-error" } as const;

function Overview() {
  const [empty, setEmpty] = useState(false);
  const jobs = empty ? [] : recentJobs;
  const nodes = empty ? [] : workerNodes;
  const c = jobCounts;
  const cards = [
    { label: "Total Jobs", value: String(c.total), tone: "text-primary", tip: "All jobs ever submitted to the system" },
    { label: "Queued Jobs", value: String(c.queued), tone: "text-warning", tip: "Jobs waiting for GPU resources" },
    { label: "Running Jobs", value: String(c.running), tone: "text-secondary", tip: "Jobs currently executing on GPU workers" },
    {
      label: "Completed/Failed",
      value: `${c.completed}/${c.failed}`,
      tone: textTone[completedFailedTone(c.completed, c.failed)],
      tip: "Completed jobs (green) vs Failed jobs (red)",
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Overview" subtitle="Real-time GPU orchestration for academic labs" />
        <label className="flex items-center gap-2 text-caption text-muted-foreground">
          <Switch checked={empty} onCheckedChange={setEmpty} />
          Preview empty states
        </label>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <Tooltip key={card.label}>
              <TooltipTrigger asChild>
                <div className="flex h-20 cursor-default flex-col items-center justify-center rounded-lg border border-border bg-card/50 p-4 text-center transition-all hover:scale-105 hover:bg-card">
                  <span className={`text-h3 ${card.tone}`}>{card.value}</span>
                  <span className="text-subtle-foreground">{card.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{card.tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Recent jobs */}
      <section className="mt-6 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <h3 className="text-primary">Recent Jobs</h3>
          <Link to="/jobs" className="text-label text-subtle-foreground transition-colors hover:text-primary">
            View All
          </Link>
        </div>
        {jobs.length === 0 ? (
          <EmptyState icon="📋" iconTone="text-muted-foreground" title="No recent jobs to display" sub="Submit your first job to see activity here" action="Submit Job" variant="secondary" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-label text-subtle-foreground">
                  {["Job ID", "Job Name", "Owner", "Status", "Submitted", "Actions"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t border-border bg-card/50 transition-colors last:border-b hover:bg-card">
                    <td className="w-20 whitespace-nowrap px-4 py-3 font-mono text-caption text-subtle-foreground">{j.id}</td>
                    <td className="max-w-32 truncate px-4 py-3 text-label text-foreground">{j.name}</td>
                    <td className="max-w-40 truncate px-4 py-3 text-label text-subtle-foreground">{j.user}</td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-label text-muted-foreground">{j.submitted}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 whitespace-nowrap">
                        <button className="text-caption text-primary hover:text-primary/75">View Logs</button>
                        {(j.status === "QUEUED" || j.status === "RUNNING") && (
                          <button className="text-caption text-error hover:text-error/75">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Workers */}
      <section className="mt-6">
        <h3 className="text-primary">Worker Status</h3>
        <p className="mb-4 text-subtle-foreground">Real-time GPU availability across nodes</p>
        {nodes.length === 0 ? (
          <div className="rounded-lg border border-border">
            <EmptyState icon="⚠️" iconTone="text-warning" title="No workers connected" sub="Start worker agents to begin processing jobs" action="Start Worker" variant="primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {nodes.map((w) => {
              const usedPct = Math.round(((w.totalGpus - w.availableGpus) / w.totalGpus) * 100);
              return (
                <div key={w.host} className="flex flex-col items-start rounded-lg border border-border bg-card/50 p-4 transition-colors hover:bg-card">
                  <span className="mb-1 font-mono text-label text-subtle-foreground">{w.host}</span>
                  <span className="mb-2"><StatusBadge status={w.state} /></span>
                  <div className={`flex items-center space-x-2 text-label ${textTone[availabilityTone(w.availableGpus, w.totalGpus)]}`}>
                    <span className="text-base">🖥️</span>
                    <span>{w.availableGpus}/{w.totalGpus} GPUs available</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface">
                    <div className={`h-2.5 transition-all duration-300 ${bgTone[utilizationTone(usedPct)]}`} style={{ width: `${usedPct}%` }} />
                  </div>
                  <span className="mt-1 text-caption text-muted-foreground">{w.lastSeen}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <p className="mt-4 text-caption text-muted-foreground">Sample data shown — live scheduler connection coming in a later phase.</p>
    </AppShell>
  );
}

function EmptyState(p: { icon: string; iconTone: string; title: string; sub: string; action: string; variant: "primary" | "secondary" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className={`text-5xl ${p.iconTone}`}>{p.icon}</span>
      <p className="mt-3 text-subtle-foreground">{p.title}</p>
      <p className="text-caption text-muted-foreground">{p.sub}</p>
      <button
        className={`mt-4 rounded-md px-4 py-2 text-label transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${p.variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/85" : "bg-secondary text-secondary-foreground hover:bg-secondary/85"}`}
      >
        {p.action}
      </button>
    </div>
  );
}
