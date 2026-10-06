import { beforeEach, expect, it, vi } from "vitest";
import {
  recordAccountDeletion,
  requiresAccountDeletionPage,
} from "../accountDeletionState";
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
it("production route selects public deletion without normal App startup", () => {
  expect(requiresAccountDeletionPage("/delete-account")).toBe(true);
  expect(requiresAccountDeletionPage("/delete-account/")).toBe(true);
  expect(requiresAccountDeletionPage("/")).toBe(false);
});
it("journal routes any startup to recovery before normal cloud hydration", () => {
  recordAccountDeletion("owner", false);
  expect(requiresAccountDeletionPage("/")).toBe(true);
});
it("pending deletion blocks tracked cloud writes and local content, including after restart", async () => {
  recordAccountDeletion("owner", false);
  const { trackedWrite, persistLocalContent, isRestoring } = await import(
    "../restoreBarrier"
  );
  const write = vi.fn(async () => undefined);
  expect(isRestoring()).toBe(true);
  await expect(trackedWrite(write)()).rejects.toThrow();
  persistLocalContent("flicklet.library.v2", "stale");
  expect(write).not.toHaveBeenCalled();
  expect(localStorage.getItem("flicklet.library.v2")).toBeNull();
});
it("ordinary restore cannot bypass deletion journal; trusted deletion retry can", async () => {
  recordAccountDeletion("owner", true);
  const { beginRestore } = await import("../restoreBarrier");
  await expect(beginRestore()).rejects.toThrow();
  const release = await beginRestore(true);
  release();
});
it("deletion waits for already active persistence before cleanup", async () => {
  const { trackedWrite, beginRestore } = await import("../restoreBarrier");
  let done!: () => void;
  const gate = new Promise<void>((resolve) => (done = resolve));
  const write = trackedWrite(async () => gate)();
  let entered = false;
  const barrier = beginRestore(true).then((release) => {
    entered = true;
    release();
  });
  await Promise.resolve();
  expect(entered).toBe(false);
  done();
  await write;
  await barrier;
  expect(entered).toBe(true);
});
