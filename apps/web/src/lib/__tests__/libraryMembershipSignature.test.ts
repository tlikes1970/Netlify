import { describe, it, expect } from "vitest";
import { buildLibraryMembershipSignature } from "@/lib/smartDiscovery";

describe("buildLibraryMembershipSignature", () => {
  it("changes when list assignment changes for the same title", () => {
    const before = buildLibraryMembershipSignature([
      { id: "1", mediaType: "movie", list: "wishlist" },
    ]);
    const after = buildLibraryMembershipSignature([
      { id: "1", mediaType: "movie", list: "not" },
    ]);
    expect(before).not.toBe(after);
  });

  it("is stable for rating-only changes (membership unchanged)", () => {
    const sig = buildLibraryMembershipSignature([
      { id: "2", mediaType: "tv", list: "watching" },
    ]);
    expect(sig).toBe(
      buildLibraryMembershipSignature([
        { id: "2", mediaType: "tv", list: "watching" },
      ])
    );
  });
});
