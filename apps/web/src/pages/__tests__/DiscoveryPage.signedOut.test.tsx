import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiscoveryPage from "../DiscoveryPage";

const useAuthMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/useSmartDiscovery", () => ({
  useSmartDiscovery: () => ({
    recommendations: [],
    isLoading: false,
    error: null,
  }),
}));

describe("DiscoveryPage signed-out state", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
  });

  it("offers the existing sign-in flow instead of a dead end", () => {
    const listener = vi.fn();
    window.addEventListener("auth:sign-in-required", listener);

    render(<DiscoveryPage />);

    expect(screen.getByText("Sign In to Discover Content")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:sign-in-required", listener);
  });

  it("does not change the signed-in empty state", () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });

    render(<DiscoveryPage />);

    expect(screen.getByText("Building Your Recommendations")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign In" })).not.toBeInTheDocument();
  });
});
