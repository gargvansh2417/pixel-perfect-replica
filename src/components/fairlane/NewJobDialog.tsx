import { useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitJob } from "@/lib/job-store";
import { validateJob, type JobFormValues } from "@/lib/job-validation";
import { btn } from "./buttons";
import { prioClass } from "./StatusBadge";

// Tiny global open/close state so any page can open the form.
let open = false;
const subs = new Set<() => void>();
export function openNewJob() {
  open = true;
  subs.forEach((s) => s());
}
function closeNewJob() {
  open = false;
  subs.forEach((s) => s());
}
function useOpen() {
  return useSyncExternalStore((l) => (subs.add(l), () => subs.delete(l)), () => open, () => false);
}

const empty: JobFormValues = { name: "", scriptPath: "", gpus: "1", memoryMb: "", priority: "3", timeoutMin: "" };
const prioLabel: Record<string, string> = { "1": "1 (Lowest)", "2": "2", "3": "3 (Default)", "4": "4", "5": "5 (Highest)" };

export function NewJobDialog() {
  const isOpen = useOpen();
  const navigate = useNavigate();
  const [v, setV] = useState<JobFormValues>(empty);
  const [touched, setTouched] = useState<Partial<Record<keyof JobFormValues, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const errors = validateJob(v);
  const valid = Object.keys(errors).length === 0;

  const set = (k: keyof JobFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV({ ...v, [k]: e.target.value });
    setTouched({ ...touched, [k]: true });
  };
  const blur = (k: keyof JobFormValues) => () => setTouched({ ...touched, [k]: true });
  const err = (k: keyof JobFormValues) => (touched[k] ? errors[k] : undefined);

  const close = () => {
    closeNewJob();
    setV(empty);
    setTouched({});
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      const job = await submitJob({
        name: v.name.trim(),
        scriptPath: v.scriptPath.trim(),
        gpus: Number(v.gpus),
        memoryMb: v.memoryMb.trim() ? Number(v.memoryMb) : null,
        priority: Number(v.priority),
        timeoutMin: v.timeoutMin.trim() ? Number(v.timeoutMin) : null,
      });
      close();
      toast.success("Job submitted successfully! Redirecting to queue...");
      navigate({ to: "/jobs", search: { q: job.id } });
    } catch (ex) {
      toast.error(`Submission failed: ${ex instanceof Error ? ex.message : "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-h2 text-primary">Submit New Job</DialogTitle>
          <DialogDescription className="text-subtle-foreground">Run ML workloads on shared GPU resources</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Job Name" required error={err("name")}>
            <input className={inputCls(err("name"))} placeholder="e.g., train_resnet50_imagenet.py" maxLength={120} value={v.name} onChange={set("name")} onBlur={blur("name")} />
          </Field>
          <Field label="Script Path" required error={err("scriptPath")} help="Must start with /mnt/nfs/users/ and point to your executable script">
            <input className={`${inputCls(err("scriptPath"))} font-mono`} placeholder="/mnt/nfs/users/yourname/jobs/job_name/train.py" maxLength={500} value={v.scriptPath} onChange={set("scriptPath")} onBlur={blur("scriptPath")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="GPU Count" required error={err("gpus")}>
              <input type="number" min={1} max={8} step={1} className={inputCls(err("gpus"))} value={v.gpus} onChange={set("gpus")} onBlur={blur("gpus")} />
            </Field>
            <Field label="Memory (MB)" error={err("memoryMb")} help="Leave blank for default allocation per GPU">
              <input type="number" min={0} max={131072} step={256} className={inputCls(err("memoryMb"))} placeholder="e.g., 8192 for 8GB" value={v.memoryMb} onChange={set("memoryMb")} onBlur={blur("memoryMb")} />
            </Field>
          </div>
          <Field label="Priority" required error={err("priority")}>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {["1", "2", "3", "4", "5"].map((p) => (
                <label
                  key={p}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-label transition-all ${prioClass[Number(p)]} ${v.priority === p ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "opacity-60 hover:opacity-90"}`}
                >
                  <input type="radio" name="priority" value={p} checked={v.priority === p} onChange={() => setV({ ...v, priority: p })} className="sr-only" />
                  {prioLabel[p]}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Timeout (minutes)" error={err("timeoutMin")} help="Job will be cancelled if exceeds this duration">
            <input type="number" min={5} max={1440} step={5} className={inputCls(err("timeoutMin"))} placeholder="e.g., 120 for 2 hours" value={v.timeoutMin} onChange={set("timeoutMin")} onBlur={blur("timeoutMin")} />
          </Field>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" className={btn("secondary")} onClick={close}>Cancel</button>
            <button type="submit" className={btn("primary")} disabled={!valid || busy}>
              {busy ? (<><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>) : "Submit Job"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-md border bg-surface px-3 py-2 text-label text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${error ? "border-error focus:ring-error/30" : "border-input focus:border-primary focus:ring-primary/20"}`;
}

function Field({ label, required, error, help, children }: { label: string; required?: boolean; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-subtle-foreground">
        {label} {required ? <span className="text-error">*</span> : <span className="text-caption text-muted-foreground">(optional)</span>}
      </span>
      {children}
      {error ? <span className="text-caption text-error">{error}</span> : help ? <span className="text-caption text-muted-foreground">{help}</span> : null}
    </div>
  );
}
