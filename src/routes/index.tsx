import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";
import { JobTable } from "@/components/fairlane/JobTable";
import { WorkerTable } from "@/components/fairlane/WorkerTable";
import { historyJobs, queueJobs, stats } from "@/lib/sample-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Fairlane GPU Orchestration" },
      { name: "description", content: "Fair, fault-tolerant GPU job scheduling dashboard for academic labs." },
      { property: "og:title", content: "Overview — Fairlane GPU Orchestration" },
      { property: "og:description", content: "Fair, fault-tolerant GPU job scheduling dashboard for academic labs." },
    ],
  }),
  component: Dashboard,
});

const tabs = ["Job Queue", "Worker Status", "Job History"] as const;

function Dashboard() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Job Queue");
  const cards = [
    { title: "Total Jobs", value: String(stats.totalJobs), label: "Submitted this week", color: "text-primary" },
    { title: "Active Workers", value: `${stats.activeWorkers}`, label: `Online/Total (${stats.activeWorkers}/${stats.totalWorkers})`, color: "text-secondary" },
    { title: "Avg GPU Util", value: `${stats.avgGpuUtil}%`, label: "Across all nodes", color: "text-warning" },
    { title: "Queue Length", value: String(stats.queueLength), label: "Jobs waiting", color: stats.queueLength > 20 ? "text-error" : "text-warning" },
  ];
  return (
    <AppShell>
      <PageHeader title="Overview" subtitle="Real-time GPU orchestration for academic labs" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-lg border border-border bg-card p-4">
            <p className="text-label text-subtle-foreground">{c.title}</p>
            <p className={`text-h3 ${c.color}`}>{c.value}</p>
            <p className="text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center border-b-2 px-4 py-2 text-label transition-colors hover:border-primary hover:text-foreground ${tab === t ? "border-primary text-primary" : "border-transparent text-subtle-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "Job Queue" && <JobTable jobs={queueJobs} />}
        {tab === "Worker Status" && <WorkerTable />}
        {tab === "Job History" && <JobTable jobs={historyJobs} />}
      </div>
      <p className="mt-4 text-caption text-muted-foreground">Sample data shown — live scheduler connection coming in a later phase.</p>
    </AppShell>
  );
}
