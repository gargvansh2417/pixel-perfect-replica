import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/fairlane/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/fairlane/StatusBadge";
import { ConfirmCancel } from "@/components/fairlane/ConfirmCancel";
import { openNewJob } from "@/components/fairlane/NewJobDialog";
import { btn } from "@/components/fairlane/buttons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { relTime, retryJob, useJobs } from "@/lib/job-store";
import { canCancel, canRetry } from "@/lib/job-validation";
import type { JobStatus } from "@/lib/sample-data";

const STATES: JobStatus[] = ["PENDING", "QUEUED", "ASSIGNED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"];
const PAGE = 20;

interface Search { q?: string; status?: string; user?: string }

export const Route = createFileRoute("/jobs/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
    user: typeof s.user === "string" ? s.user : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Job Queue — Fairlane" },
      { name: "description", content: "Monitor, filter and manage all submitted GPU jobs." },
      { property: "og:title", content: "Job Queue — Fairlane" },
      { property: "og:description", content: "Monitor, filter and manage all submitted GPU jobs." },
    ],
  }),
  component: JobQueue,
});

function JobQueue() {
  const all = useJobs();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/jobs/" });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const status = search.status ?? "ALL";
  const user = search.user ?? "ALL";
  const q = search.q ?? "";
  const users = useMemo(() => Array.from(new Set(all.map((j) => j.user))).sort(), [all]);
  const setSearch = (patch: Partial<Search>) => {
    setPage(0);
    navigate({ search: (prev: Search) => ({ ...prev, ...patch }), replace: true });
  };

  const filtered = all.filter((j) => {
    if (status !== "ALL" && j.status !== status) return false;
    if (user !== "ALL" && j.user !== user) return false;
    if (q && !`${j.id} ${j.name}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (from && j.submittedAt < new Date(from).getTime()) return false;
    if (to && j.submittedAt > new Date(to).getTime() + 86_400_000) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Job Queue" subtitle="Monitor and manage all submitted jobs" />
        <button className={btn("primary")} onClick={openNewJob}>+ New Job</button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg bg-card/50 px-6 py-4">
        <FilterLabel label="Status">
          <div className="flex items-center gap-1">
            <Select value={status} onValueChange={(s) => setSearch({ status: s === "ALL" ? undefined : s })}>
              <SelectTrigger className="h-9 w-40 border-input bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="ALL">All</SelectItem>
                {STATES.map((s) => (
                  <SelectItem key={s} value={s}><StatusBadge status={s} /></SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status !== "ALL" && (
              <button aria-label="Clear status filter" className="text-muted-foreground hover:text-foreground" onClick={() => setSearch({ status: undefined })}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </FilterLabel>
        <FilterLabel label="User">
          <Select value={user} onValueChange={(u) => setSearch({ user: u === "ALL" ? undefined : u })}>
            <SelectTrigger className="h-9 w-44 border-input bg-surface"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-popover">
              <SelectItem value="ALL">All Users</SelectItem>
              {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterLabel>
        <FilterLabel label="Search">
          <input
            value={q}
            onChange={(e) => setSearch({ q: e.target.value || undefined })}
            placeholder="Search job name or ID..."
            maxLength={100}
            className="h-9 w-[200px] rounded-md border border-input bg-surface px-3 text-label text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </FilterLabel>
        <FilterLabel label="Submitted">
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className="h-9 rounded-md border border-input bg-surface px-2 text-label text-foreground [color-scheme:dark]" />
            <span className="text-muted-foreground">–</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} className="h-9 rounded-md border border-input bg-surface px-2 text-label text-foreground [color-scheme:dark]" />
          </div>
        </FilterLabel>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-5xl">⏳</span>
            <p className="mt-3 text-subtle-foreground">No jobs match current filters</p>
            <p className="text-caption text-muted-foreground">Try adjusting filters or submit a new job</p>
            <button className={`${btn("primary")} mt-4`} onClick={openNewJob}>+ New Job</button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-label text-subtle-foreground">
                {["Job ID", "Job Name", "Owner", "GPU Req", "Memory Req", "Priority", "Status", "Submitted", "Actions"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className="border-t border-border bg-card/50 transition-colors last:border-b hover:bg-card">
                  <td className="w-20 whitespace-nowrap px-6 py-4 font-mono text-caption">
                    <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="text-subtle-foreground hover:text-primary">{j.id}</Link>
                  </td>
                  <td className="max-w-40 truncate px-6 py-4 text-label text-foreground" title={j.name}>{j.name}</td>
                  <td className="max-w-40 truncate px-6 py-4 text-label text-subtle-foreground" title={j.user}>{j.user}</td>
                  <td className="px-6 py-4 text-caption text-subtle-foreground">{j.gpus}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-caption text-subtle-foreground">{j.memoryMb ? `${Math.round(j.memoryMb / 1024)}GB` : "Default"}</td>
                  <td className="px-6 py-4"><PriorityBadge priority={j.priority} /></td>
                  <td className="px-6 py-4"><StatusBadge status={j.status} /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-label text-muted-foreground" suppressHydrationWarning>{relTime(j.submittedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 whitespace-nowrap text-label">
                      <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="text-primary hover:text-primary/75">View Details</Link>
                      {canCancel(j.status) && <button className="text-error hover:text-error/75" onClick={() => setCancelId(j.id)}>Cancel</button>}
                      {canRetry(j.status, j.retryCount, j.maxRetries) && (
                        <button className="text-warning hover:text-warning/75" onClick={() => { retryJob(j.id); toast.success(`Job ${j.id} re-submitted (retry ${j.retryCount + 1}/${j.maxRetries})`); }}>Retry</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-caption text-muted-foreground">
          {filtered.length ? `Showing ${page * PAGE + 1}-${Math.min(filtered.length, (page + 1) * PAGE)} of ${filtered.length} jobs` : "Showing 0 jobs"}
        </span>
        <div className="flex gap-2">
          <button className={btn("secondary", "xs")} disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
          <button className={btn("secondary", "xs")} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
      <ConfirmCancel jobId={cancelId} onClose={() => setCancelId(null)} />
    </AppShell>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-medium text-subtle-foreground">{label}</span>
      {children}
    </div>
  );
}
