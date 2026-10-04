import { beforeEach, expect, it, vi } from "vitest";
import { manageFullAccessGrant } from "../../../../../functions/src/fullAccessGrant";
const admin = { uid: "owner", token: { role: "admin" } };
const findUser = vi.fn();
const writeGrant = vi.fn();
const deps = { findUser, writeGrant };
beforeEach(() => {
  findUser
    .mockReset()
    .mockResolvedValue({ uid: "recipient", email: "person@example.com" });
  writeGrant.mockReset().mockResolvedValue(undefined);
});
it("rejects signed-out calls before account lookup", async () => {
  await expect(
    manageFullAccessGrant(
      undefined,
      { target: "person@example.com", isPro: true },
      deps,
    ),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  expect(findUser).not.toHaveBeenCalled();
});
it("rejects ordinary users even when body claims admin", async () => {
  await expect(
    manageFullAccessGrant(
      { uid: "x", token: {} },
      { target: "x", isPro: true, role: "admin" },
      deps,
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(writeGrant).not.toHaveBeenCalled();
});
it.each([
  null,
  {},
  { target: "", isPro: true },
  { target: "x", isPro: "true" },
  { target: 12, isPro: true },
])("rejects invalid input %j", async (input) => {
  await expect(manageFullAccessGrant(admin, input, deps)).rejects.toMatchObject(
    { code: "invalid-argument" },
  );
  expect(writeGrant).not.toHaveBeenCalled();
});
it("grants to resolved account and records authenticated administrator", async () => {
  expect(
    await manageFullAccessGrant(
      admin,
      { target: " person@example.com ", isPro: true, updatedBy: "fake" },
      deps,
    ),
  ).toEqual({
    userId: "recipient",
    email: "person@example.com",
    granted: true,
  });
  expect(findUser).toHaveBeenCalledWith("person@example.com");
  expect(writeGrant).toHaveBeenCalledWith("recipient", {
    active: true,
    version: 1,
    userId: "recipient",
    updatedBy: "owner",
  });
});
it("supports account ID and old callable payload", async () => {
  await manageFullAccessGrant(
    admin,
    { userId: "recipient", isPro: true },
    deps,
  );
  expect(findUser).toHaveBeenCalledWith("recipient");
});
it("revokes only separate grant, no billing/purchase/trial write", async () => {
  await manageFullAccessGrant(
    admin,
    { target: "recipient", isPro: false },
    deps,
  );
  expect(writeGrant).toHaveBeenCalledWith("recipient", {
    active: false,
    version: 1,
    userId: "recipient",
    updatedBy: "owner",
  });
});
it("repeated grants are idempotent", async () => {
  await manageFullAccessGrant(
    admin,
    { target: "recipient", isPro: true },
    deps,
  );
  await manageFullAccessGrant(
    admin,
    { target: "recipient", isPro: true },
    deps,
  );
  expect(writeGrant.mock.calls[0]).toEqual(writeGrant.mock.calls[1]);
});
it("unknown account never writes grant", async () => {
  findUser.mockRejectedValue(new Error("missing"));
  await expect(
    manageFullAccessGrant(admin, { target: "missing", isPro: true }, deps),
  ).rejects.toThrow();
  expect(writeGrant).not.toHaveBeenCalled();
});
it("write failure does not report success", async () => {
  writeGrant.mockRejectedValue(new Error("offline"));
  await expect(
    manageFullAccessGrant(admin, { target: "recipient", isPro: true }, deps),
  ).rejects.toThrow("offline");
});
