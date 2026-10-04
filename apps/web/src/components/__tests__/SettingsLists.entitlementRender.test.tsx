import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ paid: false, user: { uid: "paid-owner" } }));
vi.mock("../../lib/firebaseBootstrap", async (original) => ({
  ...(await original<typeof import("../../lib/firebaseBootstrap")>()),
  auth: { currentUser: state.user },
}));
vi.mock("../../lib/auth", () => ({
  authManager: {
    getCurrentUser: () => state.user,
    getUserSettings: async () => null,
    subscribe: () => () => {},
  },
}));
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, isAuthenticated: true }),
}));
vi.mock("../../lib/proStatus", () => ({
  useProStatus: () => ({
    isPro: state.paid,
    source: state.paid ? "android" : null,
  }),
}));
vi.mock("../../lib/trialEntitlement", () => ({
  resolveServerTrialStartMs: () => new Promise(() => {}),
}));
import { renderSettingsSection } from "../settingsSections";
import { customListManager } from "../../lib/customLists";
import {
  resolveEntitlements,
  setEntitlementsCache,
} from "../../lib/entitlements";

beforeEach(() => {
  state.paid = false;
  localStorage.clear();
  setEntitlementsCache(
    resolveEntitlements({
      isAuthenticated: false,
      paidPro: false,
      proSource: null,
      trialStartMs: null,
    }),
  );
  localStorage.setItem(
    "flicklet.customLists.v2",
    JSON.stringify({
      customLists: [1, 2, 3].map((id) => ({
        id: String(id),
        name: `List ${id}`,
        createdAt: id,
        itemCount: 0,
      })),
      maxLists: 3,
    }),
  );
  window.dispatchEvent(new Event("customLists:updated"));
  vi.spyOn(window, "prompt").mockReturnValue("Fourth list");
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("updates Settings through the real entitlement hook after its render has already refreshed the manager", () => {
  const view = render(renderSettingsSection("display", { isMobile: true }));
  expect(screen.queryByRole("button", { name: "Create New List" })).toBeNull();
  act(() => {
    // The cache resolves before the next hook render. getUserLists is called
    // during that render even though React retains its old three-list snapshot.
    state.paid = true;
    setEntitlementsCache(
      resolveEntitlements({
        isAuthenticated: true,
        paidPro: true,
        proSource: "android",
        trialStartMs: null,
      }),
    );
    customListManager.getUserLists();
    view.rerender(renderSettingsSection("display", { isMobile: true }));
  });
  fireEvent.click(screen.getByRole("button", { name: "Create New List" }));
  expect(customListManager.getUserLists().customLists).toHaveLength(4);
  expect(screen.getByText("Fourth list")).toBeVisible();
});

it("does not miss a notification when the manager refreshes its limit before the access callback", () => {
  const seen: number[] = [];
  // Earlier subscribers simulate a render/consumer that refreshes the manager
  // during notification. Mounted hooks must still receive the updated snapshot.
  const unsubscribe = customListManager.subscribe(() =>
    seen.push(customListManager.getUserLists().maxLists),
  );
  state.paid = true;
  act(() =>
    setEntitlementsCache(
      resolveEntitlements({
        isAuthenticated: true,
        paidPro: true,
        proSource: "android",
        trialStartMs: null,
      }),
    ),
  );
  unsubscribe();
  expect(seen).toContain(Infinity);
});
