import { describe, expect, it } from "vitest";
import { canCancel, canRetry, validateJob, type JobFormValues } from "@/lib/job-validation";

const ok: JobFormValues = {
  name: "test_training.py",
  scriptPath: "/mnt/nfs/users/demo/jobs/123/test_training.py",
  gpus: "2",
  memoryMb: "8192",
  priority: "3",
  timeoutMin: "120",
};

describe("job submission validation", () => {
  it("accepts the demo job", () => expect(validateJob(ok)).toEqual({}));
  it("job name 3-100 chars", () => {
    expect(validateJob({ ...ok, name: "ab" }).name).toBeDefined();
    expect(validateJob({ ...ok, name: "a".repeat(101) }).name).toBeDefined();
  });
  it("script path must be under /mnt/nfs/users/", () => {
    expect(validateJob({ ...ok, scriptPath: "/home/demo/train.py" }).scriptPath).toBeDefined();
  });
  it("gpu count 1-8", () => {
    expect(validateJob({ ...ok, gpus: "0" }).gpus).toBeDefined();
    expect(validateJob({ ...ok, gpus: "9" }).gpus).toBeDefined();
  });
  it("memory optional, max 131072", () => {
    expect(validateJob({ ...ok, memoryMb: "" }).memoryMb).toBeUndefined();
    expect(validateJob({ ...ok, memoryMb: "131073" }).memoryMb).toBeDefined();
  });
  it("timeout optional, 5-1440", () => {
    expect(validateJob({ ...ok, timeoutMin: "" }).timeoutMin).toBeUndefined();
    expect(validateJob({ ...ok, timeoutMin: "4" }).timeoutMin).toBeDefined();
    expect(validateJob({ ...ok, timeoutMin: "1441" }).timeoutMin).toBeDefined();
  });
  it("priority required", () => expect(validateJob({ ...ok, priority: "" }).priority).toBeDefined());
});

describe("job actions", () => {
  it("cancel only before completion", () => {
    expect(canCancel("ASSIGNED")).toBe(true);
    expect(canCancel("COMPLETED")).toBe(false);
  });
  it("retry only failed with retries left", () => {
    expect(canRetry("FAILED", 1, 3)).toBe(true);
    expect(canRetry("FAILED", 3, 3)).toBe(false);
    expect(canRetry("COMPLETED", 0, 3)).toBe(false);
  });
});
