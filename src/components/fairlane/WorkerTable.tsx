import { workers } from "@/lib/sample-data";
import { StatusBadge } from "./StatusBadge";

export function WorkerTable() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workers.map((w) => (
        <div key={w.id} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-label">{w.host}</p>
              <p className="text-caption text-muted-foreground">{w.id} · heartbeat {w.heartbeat}</p>
            </div>
            <StatusBadge status={w.state} />
          </div>
          {w.gpus.map((g) => (
            <div key={g.name} className="mt-2 rounded-md bg-surface p-3">
              <div className="flex items-center justify-between text-label">
                <span>{g.name}</span>
                <StatusBadge status={g.health} />
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-hover">
                <div className="h-full bg-primary" style={{ width: `${g.util}%` }} />
              </div>
              <p className="mt-1 text-caption text-subtle-foreground">
                {g.util}% util · {g.freeVram}/{g.totalVram} GB VRAM free
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
