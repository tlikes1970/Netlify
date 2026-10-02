import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  write: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../firebaseBootstrap", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: () => "users/one",
  updateDoc: mocks.write,
  runTransaction: vi.fn(),
}));
vi.mock("../auth", () => ({
  authManager: { getCurrentUser: () => ({ uid: "one" }) },
}));
vi.mock("../readOnlyGuard", () => ({ guardMutation: () => true }));
vi.mock("../flickletPersonality", () => ({
  clearFlickletPersonalitySession: vi.fn(),
}));
import { settingsManager } from "../settings";

afterEach(() => vi.useRealTimers());
it("general Settings sync writes only owned fields and preserves preferred name and handle", async () => {
  vi.useFakeTimers();
  settingsManager.updatePersonalityLevel(3);
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.write).toHaveBeenCalledTimes(1);
  const [reference, updates] = mocks.write.mock.calls[0];
  expect(reference).toBe("users/one");
  expect(updates["settings.personalityLevel"]).toBe(3);
  expect(updates).not.toHaveProperty("settings");
  expect(Object.keys(updates)).not.toContain("settings.preferredName");
  expect(Object.keys(updates)).not.toContain("settings.username");
  expect(Object.keys(updates).every((key) => key.startsWith("settings."))).toBe(
    true,
  );
});
