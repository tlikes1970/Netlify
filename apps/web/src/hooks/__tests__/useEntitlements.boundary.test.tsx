import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  user: { uid: "owner" },
  paid: false,
  start: 0,
  fail: false,
}));
vi.mock("../useAuth", () => ({
  useAuth: () => ({ user: m.user, isAuthenticated: true }),
}));
vi.mock("../../lib/firebaseBootstrap", () => ({
  auth: {
    get currentUser() {
      return m.user;
    },
  },
}));
vi.mock("../../lib/proStatus", () => ({
  useProStatus: () => ({ isPro: m.paid, source: m.paid ? "android" : null }),
}));
vi.mock("../../lib/trialEntitlement", () => ({
  resolveServerTrialStartMs: async () => {
    if (m.fail) throw new Error("offline");
    return m.start;
  },
}));
import { useEntitlements } from "../useEntitlements";
import { getEntitlementsSync } from "../../lib/entitlements";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
  m.user = { uid: "owner" };
  m.paid = false;
  m.fail = false;
  m.start = Date.now() - 21 * 86400000 + 1000;
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("active trial crosses expiry without restarting app", async () => {
  const { result } = renderHook(() => useEntitlements());
  await act(async () => {});
  expect(result.current.trialActive).toBe(true);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1006);
  });
  expect(result.current.isReadOnlyMode).toBe(true);
});
it("visibility resume refreshes state after clock changes", async () => {
  const { result } = renderHook(() => useEntitlements());
  await act(async () => {});
  vi.setSystemTime(Date.now() + 2000);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(result.current.trialExpired).toBe(true);
});
it("resume lifecycle refreshes access", async () => {
  const { result } = renderHook(() => useEntitlements());
  await act(async () => {});
  vi.setSystemTime(Date.now() + 2000);
  act(() => document.dispatchEvent(new Event("resume")));
  expect(result.current.isReadOnlyMode).toBe(true);
});
it("synchronous guard sees expiry before next React render", async () => {
  renderHook(() => useEntitlements());
  await act(async () => {});
  vi.setSystemTime(Date.now() + 2000);
  expect(getEntitlementsSync().isReadOnlyMode).toBe(true);
});
it("account switch does not reuse previous trial state", async () => {
  const { result, rerender } = renderHook(() => useEntitlements());
  await act(async () => {});
  m.user = { uid: "other" };
  m.start = Date.now() - 22 * 86400000;
  rerender();
  await act(async () => {});
  expect(result.current.isReadOnlyMode).toBe(true);
});
it("paid entitlement remains full when trial expires", async () => {
  m.paid = true;
  const { result } = renderHook(() => useEntitlements());
  await act(async () => {});
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1006);
  });
  expect(result.current.paidPro).toBe(true);
  expect(result.current.isReadOnlyMode).toBe(false);
});

it("unresolved signed-in trial stays read-only on server failure without cache", async () => {
  m.fail = true;
  const { result } = renderHook(() => useEntitlements());
  await act(async () => {});
  expect(result.current.isReadOnlyMode).toBe(true);
  expect(result.current.hasFullAccess).toBe(false);
});
