import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: { currentUser: null as any },
  credential: vi.fn(),
  popup: vi.fn(),
  native: vi.fn(),
  isNative: false,
}));
vi.mock("../firebaseBootstrap", () => ({ auth: m.auth }));
vi.mock("../capacitorEnv", () => ({ isCapacitorNative: () => m.isNative }));
vi.mock("../googleAuthNative", () => ({
  reauthenticateWithGoogleNative: m.native,
}));
vi.mock("firebase/auth", () => ({
  EmailAuthProvider: {
    credential: (email: string, password: string) => ({ email, password }),
  },
  GoogleAuthProvider: class Google {},
  OAuthProvider: class Apple {},
  reauthenticateWithCredential: m.credential,
  reauthenticateWithPopup: m.popup,
}));
import { reauthenticateForDeletion } from "../accountReauthentication";
beforeEach(() => {
  vi.clearAllMocks();
  m.isNative = false;
  m.auth.currentUser = {
    uid: "owner",
    email: "owner@example.test",
    providerData: [{ providerId: "google.com" }],
  };
  m.popup.mockResolvedValue(undefined);
});
it("reauthenticates Google web without signing into another account", async () => {
  await reauthenticateForDeletion();
  expect(m.popup.mock.calls[0][0]).toBe(m.auth.currentUser);
  expect(m.native).not.toHaveBeenCalled();
});
it("native Google uses existing native helper for same user", async () => {
  m.isNative = true;
  await reauthenticateForDeletion();
  expect(m.native).toHaveBeenCalledWith(m.auth.currentUser);
  expect(m.popup).not.toHaveBeenCalled();
});
it("email password verifies current account credential", async () => {
  m.auth.currentUser.providerData = [{ providerId: "password" }];
  await reauthenticateForDeletion("secret");
  expect(m.credential).toHaveBeenCalledWith(m.auth.currentUser, {
    email: "owner@example.test",
    password: "secret",
  });
});
it("password is required, never persisted", async () => {
  m.auth.currentUser.providerData = [{ providerId: "password" }];
  await expect(reauthenticateForDeletion()).rejects.toMatchObject({
    code: "password-required",
  });
  expect(m.credential).not.toHaveBeenCalled();
});
it("account change during verification is rejected", async () => {
  m.popup.mockImplementation(async () => {
    m.auth.currentUser = { uid: "other" };
  });
  await expect(reauthenticateForDeletion()).rejects.toMatchObject({
    code: "account-changed",
  });
});
it("Google cancellation propagates instead of deleting", async () => {
  m.popup.mockRejectedValue(Error("cancelled"));
  await expect(reauthenticateForDeletion()).rejects.toThrow("cancelled");
});
it("signed out cannot reauthenticate", async () => {
  m.auth.currentUser = null;
  await expect(reauthenticateForDeletion()).rejects.toMatchObject({
    code: "authentication-required",
  });
});
it("unsupported provider fails closed", async () => {
  m.auth.currentUser.providerData = [];
  await expect(reauthenticateForDeletion()).rejects.toMatchObject({
    code: "reauthentication-unavailable",
  });
});
