import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  getDoc: vi.fn(),
  doc: vi.fn((...args) => args),
}));
vi.mock("firebase/firestore", () => ({
  getDoc: m.getDoc,
  doc: m.doc,
  Timestamp: {},
  setDoc: vi.fn(),
}));
vi.mock("../firebaseBootstrap", () => ({
  db: {},
  auth: { currentUser: { uid: "owner" } },
}));
import { getAdminFullAccessGrant } from "../billing";
beforeEach(() => m.getDoc.mockReset());
it.each([
  [
    "valid",
    { active: true, version: 1, userId: "owner", updatedBy: "admin" },
    true,
  ],
  [
    "revoked",
    { active: false, version: 1, userId: "owner", updatedBy: "admin" },
    false,
  ],
  [
    "wrong account",
    { active: true, version: 1, userId: "other", updatedBy: "admin" },
    false,
  ],
  ["legacy", { isPro: true, source: "manual" }, false],
  ["missing audit", { active: true, version: 1, userId: "owner" }, false],
  [
    "unknown version",
    { active: true, version: 2, userId: "owner", updatedBy: "admin" },
    false,
  ],
])("%s grant validates correctly", async (_name, data, expected) => {
  m.getDoc.mockResolvedValue({ exists: () => true, data: () => data });
  expect(await getAdminFullAccessGrant("owner")).toBe(expected);
  expect(m.doc).toHaveBeenLastCalledWith(
    expect.anything(),
    "users",
    "owner",
    "billing",
    "adminGrant",
  );
});
it("no grant means no admin access", async () => {
  m.getDoc.mockResolvedValue({ exists: () => false });
  expect(await getAdminFullAccessGrant("owner")).toBe(false);
});
