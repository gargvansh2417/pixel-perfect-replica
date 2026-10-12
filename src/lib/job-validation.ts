export interface JobFormValues {
  name: string;
  scriptPath: string;
  gpus: string;
  memoryMb: string;
  priority: string;
  timeoutMin: string;
}

export type JobFormErrors = Partial<Record<keyof JobFormValues, string>>;

const isInt = (v: string) => /^-?\d+$/.test(v.trim());

export function validateJob(v: JobFormValues): JobFormErrors {
  const e: JobFormErrors = {};
  const name = v.name.trim();
  if (name.length < 3 || name.length > 100) e.name = "Job name must be 3-100 characters";

  const path = v.scriptPath.trim();
  if (!path || !path.startsWith("/mnt/nfs/users/") || path.length <= "/mnt/nfs/users/".length || path.includes(".."))
    e.scriptPath = "Script path must be a valid NFS path under /mnt/nfs/users/";

  const g = Number(v.gpus);
  if (!isInt(v.gpus) || g < 1 || g > 8) e.gpus = "Please select between 1 and 8 GPUs";

  if (v.memoryMb.trim() !== "") {
    const m = Number(v.memoryMb);
    if (!isInt(v.memoryMb) || m < 0 || m > 131072) e.memoryMb = "Memory must be between 0 and 131072 MB";
  }

  if (!["1", "2", "3", "4", "5"].includes(v.priority)) e.priority = "Please select a priority level";

  if (v.timeoutMin.trim() !== "") {
    const t = Number(v.timeoutMin);
    if (!isInt(v.timeoutMin) || t < 5 || t > 1440) e.timeoutMin = "Timeout must be between 5 and 1440 minutes";
  }
  return e;
}

export const CANCELLABLE = ["PENDING", "QUEUED", "ASSIGNED", "RUNNING"] as const;
export function canCancel(status: string) {
  return (CANCELLABLE as readonly string[]).includes(status);
}
export function canRetry(status: string, retryCount: number, maxRetries: number) {
  return status === "FAILED" && retryCount < maxRetries;
}
