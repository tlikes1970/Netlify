import { describe, expect, it, vi } from "vitest";
import { beginRestore, isRestoring, trackedWrite } from "../restoreBarrier";

describe("restore write coordination", () => {
  it("waits for writes already in flight and rejects new stale writes until release", async () => {
    let finish!: () => void;
    const underlying = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const write = trackedWrite(underlying);
    const pending = write();
    let acquired = false;
    const lock = beginRestore().then((release) => {
      acquired = true;
      return release;
    });
    await Promise.resolve();
    expect(acquired).toBe(false);
    expect(isRestoring()).toBe(true);
    await expect(write()).rejects.toThrow("restore is in progress");
    expect(underlying).toHaveBeenCalledOnce();
    finish();
    await pending;
    const release = await lock;
    release();
    expect(isRestoring()).toBe(false);
  });
  it("releases cleanly even if a prior ordinary write failed", async () => {
    const write = trackedWrite(async () => {
      throw new Error("offline");
    });
    const pending = write();
    const lock = beginRestore();
    await expect(pending).rejects.toThrow("offline");
    const release = await lock;
    release();
    expect(isRestoring()).toBe(false);
  });
});
