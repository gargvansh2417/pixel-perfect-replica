import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fairlane/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/fairlane/StatusBadge";
import { ConfirmCancel } from "@/components/fairlane/ConfirmCancel";
import { btn } from "@/components/fairlane/buttons";
import { clearLogs, duration, fmtClock, retryJob, useJob, type EventKind, type FullJob } from "@/lib/job-store";
import { canCancel, canRetry } from "@/lib/job-validation";

export const Route = createFileRoute("/jobs/$jobId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.jobId} — Job Details — Fairlane` },
      { name: "description", content: `Status, logs, results and lifecycle events for ${params.jobId}.` },
      { property: "og:title", content: `${params.jobId} — Fairlane` },
      { property: "og:description", content: `Status, logs, results and lifecycle events for ${params.jobId}.` },
    ],
  }),
  component: JobDetails,
});

const tabs = ["Overview", "Logs", "Results", "Events"] as const;
const dot: Record<EventKind, string> = {
  SUBMITTED: "bg-status-queued",
  QUEUED: "bg-status-queued",
  ASSIGNED: "bg-status-assigned",
  STARTED: "bg-status-running",
  COMPLETED: "bg-status-completed",
  FAILED: "bg-status-failed",
  CANCELLED: "bg-status-cancelled",
};

function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
}

function JobDetails() {
  const { jobId } = Route.useParams();
  const job = useJob(jobId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const navigate = useNavigate();
  useTick();

  if (!job) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <p className="text-subtle-foreground">Job {jobId} not found</p>
          <Link to="/jobs" className={`${btn("secondary")} mt-4`}>← Back to Queue</Link>
        </div>
      </AppShell>
    );
  }

  const username = job.user.split("@")[0];
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-all text-primary">Job Details: {job.name}</h2>
          <p className="text-subtle-foreground">Job ID: <span className="font-mono">{job.id}</span> | Owner: {job.user}</p>
        </div>
        <Link to="/jobs" className={btn("secondary")}>← Back to Queue</Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg bg-card/50 px-6 py-4">
        <StatusBadge status={job.status} size="lg" />
        <div>
          <p className="font-semibold text-foreground">Current Status: {job.status}</p>
          <Progress status={job.status} />
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-1 py-2 text-label transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab job={job} />}
      {tab === "Logs" && <LogsTab job={job} />}
      {tab === "Results" && <ResultsTab job={job} />}
      {tab === "Events" && <EventsTab job={job} />}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <span className="break-all font-mono text-caption text-muted-foreground">
          {job.status === "COMPLETED" ? `View all results in NFS: /mnt/nfs/users/${username}/jobs/${job.id}/` : "Job files stored in NFS at submission path"}
        </span>
        {job.status === "FAILED" ? (
          canRetry(job.status, job.retryCount, job.maxRetries) ? (
            <button className={btn("warning")} onClick={() => { retryJob(job.id); toast.success(`Job ${job.id} re-submitted`); }}>Retry Job</button>
          ) : (
            <span className="text-caption text-error">Max retries reached</span>
          )
        ) : canCancel(job.status) ? (
          <button className={btn("error")} onClick={() => setCancelId(job.id)}>Cancel Job</button>
        ) : (
          <button className={btn("secondary")} onClick={() => navigate({ to: "/jobs" })}>Close</button>
        )}
      </div>
      <ConfirmCancel jobId={cancelId} onClose={() => setCancelId(null)} />
    </AppShell>
  );
}

function Progress({ status }: { status: FullJob["status"] }) {
  if (status === "RUNNING")
    return <p className="flex items-center gap-2 text-label text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-status-running" />Processing...</p>;
  if (status === "COMPLETED") return <p className="text-label text-secondary">Job finished successfully</p>;
  if (status === "FAILED") return <p className="text-label text-error">Job encountered an error</p>;
  if (status === "CANCELLED") return <p className="text-label text-warning">Job was cancelled by user</p>;
  return <p className="text-label text-muted-foreground">Waiting for resources...</p>;
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption text-muted-foreground">{k}</p>
      <div className="text-label text-subtle-foreground">{children}</div>
    </div>
  );
}

function OverviewTab({ job }: { job: FullJob }) {
  const ts = (t: number | null, none: string) => (t ? new Date(t).toLocaleString() : none);
  const dur = job.startedAt ? (job.endedAt ? duration(job.startedAt, job.endedAt) : `${duration(job.startedAt, Date.now())} (in progress)`) : "In progress";
  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <Row k="Job Name">{job.name}</Row>
          <Row k="Script Path"><span className="break-all font-mono text-caption text-muted-foreground">{job.scriptPath}</span></Row>
          <Row k="Submitted"><span suppressHydrationWarning>{ts(job.submittedAt, "")}</span></Row>
          <Row k="Started"><span suppressHydrationWarning>{ts(job.startedAt, "Not started")}</span></Row>
          <Row k="Ended"><span suppressHydrationWarning>{ts(job.endedAt, "Not ended")}</span></Row>
          <Row k="Duration"><span suppressHydrationWarning>{job.startedAt ? dur : job.endedAt ? "—" : "In progress"}</span></Row>
        </div>
        <div className="space-y-4">
          <Row k="GPU Requested">{job.gpus}</Row>
          <Row k="Memory Requested">{job.memoryMb ? `${job.memoryMb} MB` : "Default"}</Row>
          <Row k="Priority"><PriorityBadge priority={job.priority} /></Row>
          <Row k="Timeout">{job.timeoutMin ? `${job.timeoutMin} min` : "None"}</Row>
          <Row k="Worker Assigned"><span className="font-mono">{job.worker ?? "Not assigned"}</span></Row>
          <Row k="Retry Count">{job.retryCount}/{job.maxRetries}</Row>
        </div>
      </div>
      {(job.status === "RUNNING" || job.status === "COMPLETED") && (
        <div className="mt-6">
          <p className="mb-2 text-label text-subtle-foreground">Resource Utilization</p>
          <div className="flex h-24 w-full items-center justify-center rounded-lg bg-card/50 p-4 text-center text-caption text-muted-foreground">
            Real-time GPU/CPU/memory usage chart will appear here during execution
          </div>
        </div>
      )}
    </>
  );
}

function LogsTab({ job }: { job: FullJob }) {
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (auto && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [job.logs.length, auto]);
  const download = () => {
    const blob = new Blob([job.logs.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${job.id}.log`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-label text-subtle-foreground">Job Logs</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-caption text-subtle-foreground">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-primary" />
            Auto-scroll
          </label>
          <button className={btn("secondary", "xs")} disabled={job.status !== "RUNNING"} onClick={() => clearLogs(job.id)}>Clear Logs</button>
          <button className={btn("secondary", "xs")} disabled={!job.logs.length} onClick={download}>Download Full Log</button>
        </div>
      </div>
      <div ref={ref} className="h-96 w-full overflow-auto rounded-lg bg-card/50 p-4 font-mono text-caption">
        {job.logs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No logs available yet</p>
        ) : (
          job.logs.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap ${/Error|Traceback/.test(l) ? "text-error" : "text-subtle-foreground"}`}>{l}</div>
          ))
        )}
      </div>
    </div>
  );
}

function ResultsTab({ job }: { job: FullJob }) {
  return (
    <div>
      <p className="mb-2 text-label text-subtle-foreground">Output Files</p>
      {job.results.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No output files generated yet</p>
      ) : (
        <div className="space-y-4">
          {job.results.map((f) => (
            <div key={f.name} className="flex items-center justify-between rounded-lg bg-card/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">📄</span>
                <div>
                  <p className="font-mono text-label text-foreground">{f.name}</p>
                  <p className="text-caption text-muted-foreground">{f.size}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className={btn("secondary", "xs")} onClick={() => toast("File preview will be available once storage is connected")}>View</button>
                <button className={btn("secondary", "xs")} onClick={() => toast("Download will be available once storage is connected")}>Download</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-caption italic text-muted-foreground">Results appear here after job completes successfully</p>
    </div>
  );
}

function EventsTab({ job }: { job: FullJob }) {
  return (
    <div>
      <p className="mb-2 text-label text-subtle-foreground">Job Lifecycle Events</p>
      {job.events.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No events recorded yet</p>
      ) : (
        <div className="space-y-3">
          {job.events.map((e, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-16 font-mono text-caption text-muted-foreground" suppressHydrationWarning>{fmtClock(e.t)}</span>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[e.kind]}`} />
              <span className="text-label text-subtle-foreground">{e.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
