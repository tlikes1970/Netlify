import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  login: vi.fn(),
  credential: vi.fn(),
  signIn: vi.fn(),
}));
vi.mock("@capgo/capacitor-social-login", () => ({
  SocialLogin: { initialize: mocks.initialize, login: mocks.login },
}));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: { credential: mocks.credential },
  signInWithCredential: mocks.signIn,
}));
vi.mock("@/lib/firebaseBootstrap", () => ({ auth: "existing-firebase-auth" }));
vi.mock("@/lib/capacitorEnv", () => ({ isCapacitorNative: () => true }));
vi.mock("@/lib/logger", () => ({ logger: { log: vi.fn() } }));

describe("existing native Google authentication contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_GOOGLE_WEB_CLIENT_ID", "test-web-client-id");
    mocks.initialize.mockResolvedValue(undefined);
    mocks.login.mockResolvedValue({ result: { idToken: "test-token" } });
    mocks.credential.mockReturnValue("existing-google-credential");
    mocks.signIn.mockResolvedValue(undefined);
  });

  it("preserves Capgo initialization, account chooser options and Firebase credential handoff", async () => {
    const { signInWithGoogleNative } = await import("@/lib/googleAuthNative");
    await signInWithGoogleNative();
    expect(mocks.initialize).toHaveBeenCalledWith({
      google: { webClientId: "test-web-client-id", mode: "online" },
    });
    expect(mocks.login).toHaveBeenCalledWith({
      provider: "google",
      options: { scopes: ["profile", "email", "openid"] },
    });
    expect(mocks.credential).toHaveBeenCalledWith("test-token");
    expect(mocks.signIn).toHaveBeenCalledWith(
      "existing-firebase-auth",
      "existing-google-credential",
    );
    await signInWithGoogleNative();
    expect(mocks.initialize).toHaveBeenCalledOnce();
  });

  it.each(["cancelled", "provider error"])(
    "propagates %s without a Firebase handoff",
    async (message) => {
      const cause = new Error(message);
      mocks.login.mockRejectedValueOnce(cause);
      const { signInWithGoogleNative } = await import("@/lib/googleAuthNative");
      await expect(signInWithGoogleNative()).rejects.toBe(cause);
      expect(mocks.signIn).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing token without attempting Firebase sign-in", async () => {
    mocks.login.mockResolvedValueOnce({ result: {} });
    const { signInWithGoogleNative } = await import("@/lib/googleAuthNative");
    await expect(signInWithGoogleNative()).rejects.toThrow(
      "did not return an ID token",
    );
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
});
