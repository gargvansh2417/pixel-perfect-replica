import { describe, expect, it } from "vitest";
import { clampPct, fmtUptime, sampleWorkers, showSampleBanner, tempTone, usageTone } from "@/lib/worker-telemetry";

describe("worker telemetry rules", () => {
  it("gpu/vram bar colours", () => {
    expect(usageTone(49)).toBe("secondary");
    expect(usageTone(50)).toBe("warning");
    expect(usageTone(80)).toBe("warning");
    expect(usageTone(81)).toBe("error");
  });
  it("temperature colours", () => {
    expect(tempTone(69)).toBe("secondary");
    expect(tempTone(75)).toBe("warning");
    expect(tempTone(86)).toBe("error");
  });
  it("bar width clamped 0-100", () => {
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(140)).toBe(100);
  });
  it("uptime format", () => expect(fmtUptime(86)).toBe("3d 14h"));
  it("sample banner when >=50% cards sample", () => {
    expect(showSampleBanner(sampleWorkers)).toBe(true);
    expect(showSampleBanner([])).toBe(false);
  });
});
