import { beforeEach, describe, expect, it } from "vitest";
import { applyRestore } from "../backup";
import {
  hasPendingCloudRestore,
  recoverLocalRestore,
  RESTORE_JOURNAL_KEY,
  resolveCloudRestore,
} from "../restoreRecovery";
beforeEach(() => localStorage.clear());
describe("interrupted restore recovery", () => {
  const journal = () => ({
    uid: "current",
    revision: "restore-operation",
    before: [
      ["flicklet.library.v2", '{"old":true}'],
      ["episode-progress-10", null],
    ],
    after: [
      ["flicklet.library.v2", '{"new":true}'],
      ["episode-progress-10", '{"episodes":{"S1E1":true}}'],
    ],
  });
  it("uses the complete restored snapshot if the atomic cloud commit succeeded", () => {
    localStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal()));
    localStorage.setItem("flicklet.library.v2", '{"old":true}');
    expect(hasPendingCloudRestore("current")).toBe(true);
    resolveCloudRestore("current", "restore-operation");
    expect(localStorage.getItem("flicklet.library.v2")).toBe('{"new":true}');
    expect(localStorage.getItem("episode-progress-10")).toContain("S1E1");
    expect(localStorage.getItem(RESTORE_JOURNAL_KEY)).toBeNull();
  });
  it("retains the previous snapshot if cloud did not commit", () => {
    localStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal()));
    localStorage.setItem("flicklet.library.v2", '{"new":true}');
    localStorage.setItem("episode-progress-10", "{}");
    resolveCloudRestore("current", "another-operation");
    expect(localStorage.getItem("flicklet.library.v2")).toBe('{"old":true}');
    expect(localStorage.getItem("episode-progress-10")).toBeNull();
  });
  it("does not apply another account recovery snapshot", () => {
    localStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal()));
    localStorage.setItem("flicklet.library.v2", '{"otherAccount":true}');
    resolveCloudRestore("different", "restore-operation");
    expect(localStorage.getItem("flicklet.library.v2")).toBe(
      '{"otherAccount":true}',
    );
  });
  it("removes private pending recovery data on sign out", () => {
    localStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal()));
    window.dispatchEvent(new CustomEvent("library:cleared"));
    expect(localStorage.getItem(RESTORE_JOURNAL_KEY)).toBeNull();
  });
  it("recovers the old local snapshot before startup while retaining cloud verification", () => {
    localStorage.setItem(RESTORE_JOURNAL_KEY, JSON.stringify(journal()));
    localStorage.setItem("flicklet.library.v2", "partially staged");
    recoverLocalRestore();
    expect(localStorage.getItem("flicklet.library.v2")).toBe('{"old":true}');
    expect(hasPendingCloudRestore("current")).toBe(true);
  });
  it("reserves recovery storage before any mutation and cleans it after rollback", async () => {
    localStorage.setItem("flicklet.library.v2", "original");
    await expect(
      applyRestore(
        new Map([["flicklet.library.v2", "imported"]]),
        localStorage,
        async () => {
          expect(
            JSON.parse(localStorage.getItem(RESTORE_JOURNAL_KEY)!).before,
          ).toEqual([["flicklet.library.v2", "original"]]);
          throw new Error("cloud failed");
        },
        () => true,
        { uid: "current", revision: "operation" },
      ),
    ).rejects.toThrow("cloud failed");
    expect(localStorage.getItem("flicklet.library.v2")).toBe("original");
    expect(localStorage.getItem(RESTORE_JOURNAL_KEY)).toBeNull();
  });
});
