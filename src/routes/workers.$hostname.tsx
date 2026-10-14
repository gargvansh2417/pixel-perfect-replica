import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/fairlane/AppShell";
import { btn } from "@/components/fairlane/buttons";
import { sampleWorkers } from "@/lib/worker-telemetry";

export const Route = createFileRoute("/workers/$hostname")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.hostname} — Worker — Fairlane` },
      { name: "description", content: `Details for worker node ${params.hostname}.` },
      { property: "og:title", content: `${params.hostname} — Fairlane` },
      { property: "og:description", content: `Details for worker node ${params.hostname}.` },
    ],
  }),
  component: WorkerDetail,
});

function WorkerDetail() {
  const { hostname } = Route.useParams();
  const w = sampleWorkers.find((x) => x.hostname === hostname);
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-primary">{hostname}</h2>
          <p className="text-subtle-foreground">{w ? `State: ${w.state}` : "Worker not found"}</p>
        </div>
        <Link to="/workers" className={btn("secondary")}>← Back to Workers</Link>
      </div>
      <div className="rounded-lg border border-dashed border-input bg-card/50 p-8 text-center text-subtle-foreground">
        Per-GPU history, assigned jobs and heartbeat log are planned. They need a connected worker agent.
      </div>
    </AppShell>
  );
}
