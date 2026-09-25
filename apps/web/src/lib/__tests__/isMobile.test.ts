import { describe, expect, it } from "vitest";
import { isMobileQuery } from "../isMobile";

describe("isMobileQuery", () => {
  it("ends mobile before Tailwind md so 768px is not both", () => {
    expect(isMobileQuery).toBe("(max-width: 767px)");
  });
});
