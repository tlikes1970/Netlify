import { describe, it, expect } from "vitest";
import { formatListShareText, getFlickletShareStamp } from "@/lib/shareLinks";

describe("formatListShareText", () => {
  it("includes list title, items, and Flicklet stamp", () => {
    const text = formatListShareText("Summer Picks", [
      { title: "Dune: Part Two", mediaType: "movie", voteAverage: 8.1 },
      { title: "Severance", mediaType: "tv", userRating: 9 },
    ]);

    expect(text).toContain("📋 Summer Picks");
    expect(text).toContain("🎬 Dune: Part Two ⭐ 8.1");
    expect(text).toContain("📺 Severance ⭐ 9.0");
    expect(text).toContain(getFlickletShareStamp().trim());
    expect(text).toContain("Track your shows and movies with Flicklet!");
  });

  it("handles empty lists", () => {
    const text = formatListShareText("Empty List", []);
    expect(text).toContain("(No shows yet)");
    expect(text).toContain("Track your shows and movies with Flicklet!");
  });
});
