import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: { currentUser: { uid: "owner" } as { uid: string } | null },
  billing: vi.fn(),
}));
vi.mock("../firebaseBootstrap", () => ({ auth: m.auth }));
vi.mock("../billing", () => ({ getBillingStatus: m.billing }));
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: m.auth.currentUser }),
}));
import {
  getProStatus,
  getProStatusSync,
  clearBillingCache,
} from "../proStatus";
const paid = () => ({
  isPro: true,
  verified: true,
  verificationVersion: 2,
  purchaseType: "one_time",
  productId: "flicklet_full_access",
  ownershipId: "a".repeat(64),
});
beforeEach(() => {
  clearBillingCache();
  m.auth.currentUser = { uid: "owner" };
  m.billing.mockReset().mockResolvedValue(paid());
});
it("valid verified ownership grants paid access", async () => {
  expect((await getProStatus()).isPro).toBe(true);
});
it("legacy one-time flag never grants permanent access", async () => {
  m.billing.mockResolvedValue({ isPro: true, purchaseType: "one_time" });
  expect((await getProStatus()).isPro).toBe(false);
  expect((await getProStatus()).isPro).toBe(false);
});
it("expired legacy subscription never becomes paid on cache hit", async () => {
  m.billing.mockResolvedValue({
    isPro: true,
    currentPeriodEnd: { toDate: () => new Date(0) },
  });
  expect((await getProStatus()).isPro).toBe(false);
  expect((await getProStatus()).isPro).toBe(false);
});
it("manual grants are historical only", async () => {
  m.billing.mockResolvedValue({ isPro: true, source: "manual" });
  expect((await getProStatus()).isPro).toBe(false);
});
it("sign-out cannot read paid cache", async () => {
  await getProStatus();
  m.auth.currentUser = null;
  expect(getProStatusSync().isPro).toBe(false);
  expect((await getProStatus()).isPro).toBe(false);
});
it("account B cannot inherit A cache", async () => {
  await getProStatus();
  m.auth.currentUser = { uid: "other" };
  m.billing.mockResolvedValue({ isPro: false });
  expect(getProStatusSync().isPro).toBe(false);
  expect((await getProStatus()).isPro).toBe(false);
  expect(m.billing).toHaveBeenLastCalledWith("other");
});
it("stale A response does not cache or grant in B", async () => {
  let resolve!: (value: unknown) => void;
  m.billing.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const request = getProStatus();
  m.auth.currentUser = { uid: "other" };
  resolve(paid());
  expect((await request).isPro).toBe(false);
  expect(getProStatusSync().isPro).toBe(false);
});
it("invalidated in-flight request cannot overwrite latest result", async () => {
  let resolve!: (value: unknown) => void;
  m.billing.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const request = getProStatus();
  clearBillingCache();
  m.billing.mockResolvedValue({ isPro: false });
  await getProStatus();
  resolve(paid());
  await request;
  expect(getProStatusSync().isPro).toBe(false);
});
it("concurrent resolvers coalesce provider reads", async () => {
  await Promise.all([getProStatus(), getProStatus()]);
  expect(m.billing).toHaveBeenCalledOnce();
});
it("wrong ownership marker fails closed", async () => {
  m.billing.mockResolvedValue({ ...paid(), ownershipId: "bad" });
  expect((await getProStatus()).isPro).toBe(false);
});
