import { renderHook, act, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  user: { uid: "owner" } as { uid: string } | null,
  android: true,
  restore: vi.fn(),
}));
vi.mock("../useAuth", () => ({ useAuth: () => ({ user: m.user }) }));
vi.mock("../../lib/proUpgrade", () => ({
  isAndroidBillingAvailable: () => m.android,
  restoreFullAccess: m.restore,
}));
import { usePurchaseReconciliation } from "../usePurchaseReconciliation";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-04"));
  m.user = { uid: "owner" };
  m.android = true;
  m.restore.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("Android sign-in reconciles without requiring button", () => {
  renderHook(() => usePurchaseReconciliation());
  expect(m.restore).toHaveBeenCalledWith(false);
});
it("web never queries Play ownership", () => {
  m.android = false;
  renderHook(() => usePurchaseReconciliation());
  expect(m.restore).not.toHaveBeenCalled();
});
it("signed out never reconciles another account", () => {
  m.user = null;
  renderHook(() => usePurchaseReconciliation());
  expect(m.restore).not.toHaveBeenCalled();
});
it("account change starts independent reconciliation", () => {
  const { rerender } = renderHook(() => usePurchaseReconciliation());
  m.user = { uid: "other" };
  rerender();
  expect(m.restore).toHaveBeenCalledTimes(2);
});
it("foreground recovery throttles repeated visibility events", () => {
  renderHook(() => usePurchaseReconciliation());
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(m.restore).toHaveBeenCalledOnce();
  vi.setSystemTime(Date.now() + 60001);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(m.restore).toHaveBeenCalledTimes(2);
});
