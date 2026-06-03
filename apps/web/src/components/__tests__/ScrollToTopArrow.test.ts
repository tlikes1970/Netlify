import { describe, it, expect } from "vitest";
import {
  scrollThresholdForViewport,
  MOBILE_THRESHOLD_VH,
  DESKTOP_THRESHOLD_VH,
} from "@/components/ScrollToTopArrow";

describe("scrollThresholdForViewport", () => {
  it("uses ~1 viewport height on mobile", () => {
    expect(scrollThresholdForViewport(800, true)).toBe(800 * MOBILE_THRESHOLD_VH);
  });

  it("uses ~1.25 viewport heights on desktop", () => {
    expect(scrollThresholdForViewport(900, false)).toBe(900 * DESKTOP_THRESHOLD_VH);
  });

  it("respects fixed px override", () => {
    expect(scrollThresholdForViewport(800, true, 200)).toBe(200);
  });
});
