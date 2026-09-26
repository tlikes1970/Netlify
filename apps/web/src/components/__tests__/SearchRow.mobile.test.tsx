/**
 * Test: SearchRow Mobile Behavior
 * Purpose: Verify mobile-specific search UI optimizations
 *
 * Tests:
 * - Mobile button layout (Filter, Input, Search only)
 * - Inline clear button (no separate Clear button)
 * - Filter sheet opens on mobile
 * - Touch-friendly button sizes (min 44px)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import FlickletHeader from "../FlickletHeader";

// Mock isMobileNow to control mobile state
const mockIsMobileNow = vi.fn(() => false);
const mockIsCapacitorAndroid = vi.fn(() => false);
vi.mock("../../lib/isMobile", () => ({
  isMobileNow: () => mockIsMobileNow(),
  onMobileChange: () => () => undefined,
}));

vi.mock("../../lib/capacitorEnv", () => ({
  isCapacitorAndroid: () => mockIsCapacitorAndroid(),
  isCapacitorNative: () => mockIsCapacitorAndroid(),
}));

// Mock VoiceSearch to return null (disabled)
vi.mock("../VoiceSearch", () => ({
  default: () => null,
}));

// Mock SearchSuggestions
vi.mock("../SearchSuggestions", () => ({
  default: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="search-suggestions">Suggestions</div> : null,
  addSearchToHistory: vi.fn(),
}));

describe("SearchRow Mobile Behavior", () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to desktop by default
    mockIsMobileNow.mockReturnValue(false);
    mockIsCapacitorAndroid.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mobile Button Layout", () => {
    it("shows Filter, Input, and Search button on mobile", () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      // Should have Filter button
      const filterButton = screen.getByRole("button", { name: /filters/i });
      expect(filterButton).toBeInTheDocument();

      // Should have Search input
      const searchInput = screen.getByRole("searchbox");
      expect(searchInput).toBeInTheDocument();

      // Should have Search button
      const searchButton = screen.getByRole("button", { name: /search/i });
      expect(searchButton).toBeInTheDocument();

      // Should NOT have separate Clear button on mobile
      const clearButtons = screen.queryAllByRole("button", { name: /clear/i });
      expect(clearButtons.length).toBe(0);
    });

    it("shows inline clear icon when input has text on mobile", () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const searchInput = screen.getByRole("searchbox") as HTMLInputElement;

      // Type in search input
      fireEvent.change(searchInput, { target: { value: "test query" } });

      // Should show inline clear button (X icon)
      const clearIcon = screen.getByRole("button", { name: /clear search/i });
      expect(clearIcon).toBeInTheDocument();
    });
  });

  describe("Touch-Friendly Button Sizes", () => {
    it("ensures buttons have minimum 44px height on mobile", () => {
      mockIsMobileNow.mockReturnValue(true);

      const { container } = render(
        <FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />,
      );

      const filterButton = screen.getByRole("button", { name: /filters/i });
      const searchButton = screen.getByRole("button", { name: /search/i });

      // 2.75rem = 44px at default 16px root; rem lets the row grow with font scale
      expect(filterButton.className).toContain("min-h-[2.75rem]");
      expect(searchButton.className).toContain("min-h-[2.75rem]");
    });

    it("allows enlarged mobile search controls to wrap without clipping actions", () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const searchButton = screen.getByRole("button", { name: /^search$/i });

      expect(screen.getByTestId("search-input-shell").className).toContain(
        "min-w-[min(12rem,100%)]",
      );
      expect(screen.getByTestId("search-actions").className).toContain(
        "flex-[1_0_auto]",
      );
      expect(searchButton.className).toContain("w-full");
    });
  });

  describe("Mobile Filter Menu", () => {
    it("opens the filter menu when Filter is clicked on mobile", async () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const filterButton = screen.getByRole("button", { name: /filters/i });

      await act(async () => {
        fireEvent.click(filterButton);
      });

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /advanced search/i }),
      ).toBeInTheDocument();
    });

    it("closes the filter menu when its backdrop is clicked", async () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const filterButton = screen.getByRole("button", { name: /filters/i });

      await act(async () => {
        fireEvent.click(filterButton);
      });

      const backdrop = document.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(backdrop!);
      });

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("closes Filters on browser Back and can reopen it", async () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const filterButton = screen.getByRole("button", { name: /filters/i });

      await act(async () => {
        fireEvent.click(filterButton);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await act(async () => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(filterButton);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("handles Android Back without leaving the active document", async () => {
      mockIsMobileNow.mockReturnValue(true);
      mockIsCapacitorAndroid.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const filterButton = screen.getByRole("button", { name: /filters/i });
      await act(async () => {
        fireEvent.click(filterButton);
      });

      const backEvent = new CustomEvent("flicklet:android-back", {
        cancelable: true,
      });
      await act(async () => {
        window.dispatchEvent(backEvent);
      });

      expect(backEvent.defaultPrevented).toBe(true);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes Filters on rotation and can reopen it", async () => {
      mockIsMobileNow.mockReturnValue(true);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      const filterButton = screen.getByRole("button", { name: /filters/i });

      await act(async () => {
        fireEvent.click(filterButton);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await act(async () => {
        window.dispatchEvent(new Event("orientationchange"));
      });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(filterButton);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
  });

  describe("Desktop Behavior", () => {
    it("shows Clear button on desktop", () => {
      mockIsMobileNow.mockReturnValue(false);

      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);

      // Should have Clear button on desktop
      const clearButton = screen.getByRole("button", { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });
  });
});
