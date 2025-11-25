import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SettingsSheet from "@/components/settings/SettingsSheet";
import { settingsManager } from "@/lib/settings";

const mockUseAuth = vi.fn();
const mockUseProStatus = vi.fn();
const mockUseAdminRole = vi.fn();

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
    await user.click(screen.getByRole("button", { name: "Pro" }));
    expect(
      screen.getByRole("heading", { name: "Upgrade to Flicklet Pro" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Pro" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Treat this device as Pro (Alpha / Testing)")
    ).toBeNull();
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

    render(<SettingsSheet />);
    expect(screen.getByRole("button", { name: "Community" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Pro" }));
    expect(
      screen.getByRole("heading", { name: "Upgrade to Flicklet Pro" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Pro" })
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

    render(<SettingsSheet />);
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Pro" }));
    expect(
      screen.getByRole("heading", { name: "You are a Pro User!" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Pro" })
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

    render(<SettingsSheet />);
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Pro" }));
    expect(
      screen.getByText("Treat this device as Pro (Alpha / Testing)")
    ).toBeInTheDocument();

    const toggle = screen.getByRole("checkbox");
    const updateSpy = vi.spyOn(settingsManager, "updateProStatus");
    expect(updateSpy).not.toHaveBeenCalled();
    await user.click(toggle);
    expect(updateSpy).toHaveBeenCalledWith(false);
    updateSpy.mockRestore();
  });
});

