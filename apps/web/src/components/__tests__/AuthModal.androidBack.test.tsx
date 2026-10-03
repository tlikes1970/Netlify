import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(()=>vi.restoreAllMocks());
it('offers browser recovery in standalone web-app context without claiming an embedded browser',()=>{
 vi.spyOn(window,'matchMedia').mockReturnValue({matches:true,addListener:vi.fn(),removeListener:vi.fn()} as unknown as MediaQueryList);
 render(<AuthModal isOpen onClose={()=>{}}/>);
 expect(screen.getByRole('button',{name:/Google/})).toBeDisabled();
 expect(screen.getByText(/Sign-in may not work in this browser or installed web app/)).toBeInTheDocument();
 const link=screen.getByRole('link',{name:'Open in Browser'});
 expect(link).toHaveAttribute('target','_blank');expect(link.getAttribute('href')).toContain('redirect_bounce=1');
});
