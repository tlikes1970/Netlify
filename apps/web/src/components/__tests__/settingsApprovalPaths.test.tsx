import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SettingsSheet from "@/components/settings/SettingsSheet";

const mockUseAuth = vi.fn();
const mockUseProStatus = vi.fn();
const mockUseAdminRole = vi.fn();
const mockUseEntitlements = vi.fn();

const guestEntitlements = {
  phase: "guest" as const,
  paidPro: false,
  proSource: null,
  trialActive: false,
  trialExpired: false,
  hasFullAccess: false,
  isReadOnlyMode: false,
  trialStartMs: null,
  trialDaysRemaining: null,
};

const expiredReadOnlyEntitlements = {
  phase: "expiredReadOnly" as const,
  paidPro: false,
  proSource: null,
  trialActive: false,
  trialExpired: true,
  hasFullAccess: false,
  isReadOnlyMode: true,
  trialStartMs: Date.now() - 30 * 24 * 60 * 60 * 1000,
  trialDaysRemaining: 0,
};

const paidEntitlements = {
  phase: "paidPro" as const,
  paidPro: true,
  proSource: "alpha" as const,
  trialActive: false,
  trialExpired: false,
  hasFullAccess: true,
  isReadOnlyMode: false,
  trialStartMs: null,
  trialDaysRemaining: null,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useAdminRole", () => ({
  useAdminRole: () => mockUseAdminRole(),
}));

vi.mock("@/lib/proStatus", async () => {
  const actual = await vi.importActual<typeof import("@/lib/proStatus")>(
    "@/lib/proStatus"
  );
  return {
    ...actual,
    useProStatus: () => mockUseProStatus(),
  };
});

vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => mockUseEntitlements(),
}));

describe("Settings approval paths", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "";
    document.documentElement.setAttribute("data-settings-sheet", "true");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      authInitialized: true,
      status: "idle",
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      createAccountWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    mockUseProStatus.mockReturnValue({ isPro: false, source: null });
    mockUseAdminRole.mockReturnValue({ isAdmin: false, loading: false });
    mockUseEntitlements.mockReturnValue(guestEntitlements);
  });

  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-settings-sheet");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    window.history.replaceState(null, "", "/");
    window.location.hash = "";
    vi.clearAllMocks();
  });

  it("keeps admin-only controls hidden for anonymous visitors while showing upgrade CTAs", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      authInitialized: true,
      status: "idle",
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      createAccountWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    mockUseProStatus.mockReturnValue({ isPro: false, source: null });
    mockUseAdminRole.mockReturnValue({ isAdmin: false, loading: false });

    render(<SettingsSheet />);
    expect(
      screen.getByRole("button", { name: "Account & Profile" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Full Access" }));
    expect(
      screen.getByRole("heading", { name: "Support Flicklet" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unlock Full Access" })
    ).toBeInTheDocument();
  });

  it("lets a signed-in free user browse settings sections and still sees upgrade messaging", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { uid: "free-user" },
      loading: false,
      authInitialized: true,
      status: "signed-in",
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      createAccountWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    mockUseProStatus.mockReturnValue({ isPro: false, source: null });
    mockUseAdminRole.mockReturnValue({ isAdmin: false, loading: false });
    mockUseEntitlements.mockReturnValue(expiredReadOnlyEntitlements);

    render(<SettingsSheet />);
    expect(screen.queryByRole("button", { name: "Community" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Full Access" }));
    expect(
      screen.getByRole("heading", { name: "Trial ended — Read-Only" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your trial has ended, but your library is still yours/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Full Access is a one-time purchase/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unlock Full Access" })
    ).toBeInTheDocument();
  });

  it("shows Pro confirmations and hides upgrade prompts for a Pro account", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { uid: "pro-user" },
      loading: false,
      authInitialized: true,
      status: "pro",
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      createAccountWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    mockUseProStatus.mockReturnValue({ isPro: true, source: "alpha" });
    mockUseAdminRole.mockReturnValue({ isAdmin: false, loading: false });
    mockUseEntitlements.mockReturnValue(paidEntitlements);

    render(<SettingsSheet />);
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Full Access" }));
    expect(
      screen.getByRole("heading", { name: "Thanks for supporting Flicklet" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unlock Full Access" })
    ).toBeNull();
  });

  it("adds the Admin section and admin-only pro toggle when the user is an admin", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { uid: "admin-user" },
      loading: false,
      authInitialized: true,
      status: "admin",
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      createAccountWithEmail: vi.fn(),
      signOut: vi.fn(),
    });
    mockUseProStatus.mockReturnValue({ isPro: true, source: "alpha" });
    mockUseAdminRole.mockReturnValue({ isAdmin: true, loading: false });
    mockUseEntitlements.mockReturnValue(paidEntitlements);

    render(<SettingsSheet />);
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Full Access" }));
    expect(
      screen.getByRole("heading", { name: "Thanks for supporting Flicklet" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unlock Full Access" })
    ).toBeNull();
  });
});

