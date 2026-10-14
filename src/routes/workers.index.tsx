import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/fairlane/AppShell";
import { WorkerCard, type WorkerAction } from "@/components/fairlane/WorkerCard";
import { btn } from "@/components/fairlane/buttons";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sampleWorkers, showSampleBanner, type WorkerTelemetry } from "@/lib/worker-telemetry";

export const Route = createFileRoute("/workers/")({
  head: () => ({
    meta: [
      { title: "Worker Status — Fairlane" },
      { name: "description", content: "Health and utilization of GPU worker nodes in the Fairlane cluster." },
      { property: "og:title", content: "Worker Status — Fairlane" },
      { property: "og:description", content: "Health and utilization of GPU worker nodes in the Fairlane cluster." },
    ],
  }),
  component: WorkersPage,
});

type Demo = "normal" | "empty" | "error";
const messages: Record<WorkerAction, (h: string) => string> = {
  Drain: (h) => `Draining ${h} will stop accepting new jobs. Currently running jobs will complete normally. Continue?`,
  Resume: (h) => `Resuming ${h} will let it accept new jobs again. Continue?`,
  Retire: (h) => `Retiring ${h} permanently removes it from the cluster. It must re-register to return. Continue?`,
};

function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerTelemetry[]>(sampleWorkers);
  const [auto, setAuto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState<string>("—");
  const [demo, setDemo] = useState<Demo>("normal");
  const [pending, setPending] = useState<{ w: WorkerTelemetry; a: WorkerAction } | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    // Mock fetch: keeps sample values unchanged (no fake fluctuation), min 500ms spinner.
    setTimeout(() => {
      setLoading(false);
      setUpdated(new Date().toLocaleTimeString());
    }, 600);
  }, []);

  useEffect(() => {
    setUpdated(new Date().toLocaleTimeString());
  }, []);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [auto, refresh]);

  const confirm = () => {
    if (!pending) return;
    const { w, a } = pending;
    setWorkers((ws) =>
      a === "Retire" ? ws.filter((x) => x.hostname !== w.hostname)
        : ws.map((x) => (x.hostname === w.hostname ? { ...x, state: a === "Drain" ? "DRAINING" : "ONLINE" } : x)),
    );
    toast.success(`${w.hostname}: ${a.toLowerCase()} requested (mock — no agent contacted)`);
    setPending(null);
  };

  const shown = demo === "empty" ? [] : workers;

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-primary">Worker Status</h2>
          <p className="text-subtle-foreground">Real-time health and utilization of GPU worker nodes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className={btn("secondary")} onClick={refresh}>Refresh Now</button>
          <label className="flex items-center gap-2 text-label text-subtle-foreground">
            <Switch checked={auto} onCheckedChange={setAuto} /> Auto-refresh (30s)
          </label>
          <span className="text-caption text-muted-foreground">Last updated: {updated}</span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-end gap-2 text-caption text-muted-foreground">
        Preview state
        <Select value={demo} onValueChange={(v) => setDemo(v as Demo)}>
          <SelectTrigger className="h-8 w-40 border-input bg-surface"><SelectValue /></SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="normal">Workers (sample)</SelectItem>
            <SelectItem value="empty">No workers</SelectItem>
            <SelectItem value="error">Connection lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {demo !== "empty" && showSampleBanner(shown) && (
        <div className="my-4 rounded border border-warning/20 bg-warning/10 px-4 py-2 text-label text-warning">
          ⚠️ Worker telemetry contains sample data. Actual metrics require connected worker agents.
        </div>
      )}

      {demo === "error" ? (
        <div className="rounded-lg border border-error bg-error/10 p-6">
          <div className="mb-3 text-2xl text-error">⚠️</div>
          <p className="text-lg font-semibold text-error">Connection Lost</p>
          <p className="text-error/80">Unable to reach worker agent. Check network or worker status.</p>
          <button className={`${btn("primary")} mt-4`} onClick={() => { setDemo("normal"); refresh(); }}>Retry Connection</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl text-muted-foreground">⚙️</div>
          <h3 className="mt-3 text-primary">No Workers Connected</h3>
          <p className="text-subtle-foreground">Start worker agents on GPU nodes to begin monitoring.</p>
          <p className="text-caption text-muted-foreground">Each worker must run the Fairlane agent script and register with the central server.</p>
          <button className={`${btn("secondary")} mt-4`} onClick={() => toast("Agent guide will be published with the Worker Agent module")}>Download Agent Guide</button>
        </div>
      ) : (
        <TooltipProvider delayDuration={150}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((w) => <WorkerCard key={w.hostname} w={w} onAction={(a) => setPending({ w, a })} />)}
          </div>
        </TooltipProvider>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/50 border-t-primary" />
          <p className="text-primary/75">Loading worker status...</p>
        </div>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-foreground">Confirm Action</AlertDialogTitle>
            <AlertDialogDescription className="text-subtle-foreground">{pending && messages[pending.a](pending.w.hostname)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={btn("secondary")}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={btn("primary")} onClick={confirm}>{pending?.a}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
