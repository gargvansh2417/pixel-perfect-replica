import type { Job } from "@/lib/sample-data";
import { StatusBadge } from "./StatusBadge";

export function JobTable({ jobs }: { jobs: Job[] }) {
  const heads = ["Job ID", "Name", "User", "Priority", "Status", "Submitted", "Actions"];
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            {heads.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-label text-subtle-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-subtle-foreground">No jobs match current filters</td>
            </tr>
          )}
          {jobs.map((j) => (
            <tr key={j.id + j.status} className="border-t border-border bg-card/50 transition-colors hover:bg-card">
              <td className="px-4 py-3 font-mono text-label">{j.id}</td>
              <td className="px-4 py-3 font-mono text-label">{j.name}</td>
              <td className="px-4 py-3 text-label text-subtle-foreground">{j.user}</td>
              <td className="px-4 py-3">{j.priority}</td>
              <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-label text-muted-foreground">{j.submitted}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className="flex gap-2">
                  <button className="rounded bg-surface px-2 py-1 text-caption text-foreground hover:bg-hover">View Logs</button>
                  {(j.status === "QUEUED" || j.status === "RUNNING") && (
                    <button className="rounded bg-destructive px-2 py-1 text-caption text-destructive-foreground hover:bg-destructive-hover">Cancel</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
