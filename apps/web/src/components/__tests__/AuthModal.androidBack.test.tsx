import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthModal from "@/components/AuthModal";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signInWithProvider: vi.fn(),
    signInWithEmail: vi.fn(),
    createAccountWithEmail: vi.fn(),
  }),
}));

describe("AuthModal Android Back", () => {
  it("consumes Android Back and closes the active auth modal", () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    let handled = false;
    act(() => {
      handled = !window.dispatchEvent(
        new CustomEvent("flicklet:android-back", { cancelable: true }),
      );
    });

    expect(handled).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
