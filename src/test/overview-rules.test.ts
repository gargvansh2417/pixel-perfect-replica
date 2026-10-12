import { describe, expect, it } from "vitest";
import { availabilityTone, completedFailedTone, utilizationTone } from "@/lib/overview-data";

describe("overview colour rules", () => {
  it("completed/failed card", () => {
    expect(completedFailedTone(89, 5)).toBe("secondary");
    expect(completedFailedTone(3, 7)).toBe("error");
    expect(completedFailedTone(4, 4)).toBe("warning");
  });
  it("gpu availability text", () => {
    expect(availabilityTone(3, 4)).toBe("secondary");
    expect(availabilityTone(2, 4)).toBe("warning");
    expect(availabilityTone(1, 4)).toBe("error");
  });
  it("utilization bar", () => {
    expect(utilizationTone(25)).toBe("secondary");
    expect(utilizationTone(50)).toBe("warning");
    expect(utilizationTone(75)).toBe("error");
  });
});
