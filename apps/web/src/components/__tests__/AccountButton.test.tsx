import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import AccountButton from "@/components/AccountButton";
import type { AuthUser } from "@/lib/auth.types";

const mocks = vi.hoisted(() => ({
  user: null as AuthUser | null,
  signOut: vi.fn(),
  googleLogin: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mocks.user,
    isAuthenticated: !!mocks.user,
    signOut: mocks.signOut,
    signInWithProvider: vi.fn(),
    signInWithEmail: vi.fn(),
    createAccountWithEmail: vi.fn(),
  }),
}));
vi.mock("@/lib/authLogin", () => ({ googleLogin: mocks.googleLogin }));
vi.mock("@/lib/language", async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(),
  useTranslations: () => ({ signIn: "Sign In" }),
}));
vi.mock("@/lib/capacitorEnv", () => ({ isCapacitorNative: () => true }));
vi.mock("@/lib/authLog", () => ({ authLogManager: { log: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logger: { log: vi.fn(), error: vi.fn() } }));

function signedIn() {
  mocks.user = {
    uid: "test-user",
    displayName: "Test User",
    email: "test@example.com",
    photoURL: null,
  };
  return render(<AccountButton />);
}
function openConfirmation() {
  fireEvent.click(screen.getByTestId("account-button"));
}

describe("account control", () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.signOut.mockReset().mockResolvedValue(undefined);
    mocks.googleLogin.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows visible Log In and opens the existing AuthModal and Google entry point", async () => {
    render(<AccountButton />);
    const button = screen.getByRole("button", { name: "Log In" });
    expect(within(button).getByText("Log In")).toBeVisible();
    fireEvent.click(button);
    expect(screen.queryByRole("button", { name: "Log Out" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /Sign in with Google/i }),
    );
    await waitFor(() => expect(mocks.googleLogin).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Sign in with Google/i }),
      ).toBeNull(),
    );
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("can dismiss the existing sign-in UI without authenticating or logging out", () => {
    render(<AccountButton />);
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("button", { name: /Sign in with Google/i }),
    ).toBeNull();
    expect(mocks.googleLogin).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it.each(["Google Sign-In cancelled", "Google Sign-In failed"])(
    "keeps the existing auth error/cancellation handling: %s",
    async (message) => {
      mocks.googleLogin.mockRejectedValueOnce(new Error(message));
      render(<AccountButton />);
      fireEvent.click(screen.getByRole("button", { name: "Log In" }));
      fireEvent.click(
        screen.getByRole("button", { name: /Sign in with Google/i }),
      );
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Sign in with Google/i }),
      ).not.toBeDisabled();
      expect(mocks.signOut).not.toHaveBeenCalled();
    },
  );

  it("shows Log Out and opens confirmation directly without an Account dialog", () => {
    signedIn();
    expect(screen.getByTestId("account-button")).toHaveTextContent("Log Out");
    openConfirmation();
    expect(
      screen.getByRole("alertdialog", { name: "Log out?" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Account" })).toBeNull();
    expect(screen.queryByText("Test User")).toBeNull();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("requires confirmation, and Cancel returns to the app without signing out", () => {
    signedIn();
    openConfirmation();
    expect(
      screen.getByRole("alertdialog", { name: "Log out?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to log out?"),
    ).toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("signs out exactly once even on repeated confirmation while pending, then closes", async () => {
    let finish!: () => void;
    mocks.signOut.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { rerender } = signedIn();
    openConfirmation();
    const confirm = within(screen.getByRole("alertdialog")).getByRole(
      "button",
      { name: "Log Out" },
    );
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await act(async () => finish());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    mocks.user = null;
    rerender(<AccountButton />);
    expect(screen.getByRole("button", { name: "Log In" })).toBeVisible();
  });

  it("keeps a failed logout recoverable without silently closing the dialog", async () => {
    mocks.signOut.mockRejectedValueOnce(new Error("network error"));
    signedIn();
    openConfirmation();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Log Out",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not log out. Please try again.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("supports Escape, keyboard focus containment and restores focus when closed", async () => {
    signedIn();
    openConfirmation();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Log Out",
      }),
    ).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByTestId("account-button")).toHaveFocus();
  });

  it("consumes Android Back, dismissing confirmation to the app", () => {
    signedIn();
    openConfirmation();
    const back = () => {
      let accepted = true;
      act(() => {
        accepted = window.dispatchEvent(
          new CustomEvent("flicklet:android-back", { cancelable: true }),
        );
      });
      expect(accepted).toBe(false);
    };
    back();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("dismisses by backdrop and closes when authentication changes externally", () => {
    const { rerender } = signedIn();
    openConfirmation();
    fireEvent.click(screen.getByRole("presentation"));
    expect(screen.queryByRole("dialog")).toBeNull();
    openConfirmation();
    mocks.user = null;
    rerender(<AccountButton />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
  });
});
