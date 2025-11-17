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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import FlickletHeader from '../FlickletHeader';

// Mock isMobileNow to control mobile state
const mockIsMobileNow = vi.fn(() => false);
vi.mock('../../lib/isMobile', () => ({
  isMobileNow: () => mockIsMobileNow(),
}));

// Mock VoiceSearch to return null (disabled)
vi.mock('../VoiceSearch', () => ({
  default: () => null,
}));

// Mock SearchSuggestions
vi.mock('../SearchSuggestions', () => ({
  default: ({ isVisible }: { isVisible: boolean }) => 
    isVisible ? <div data-testid="search-suggestions">Suggestions</div> : null,
  addSearchToHistory: vi.fn(),
}));

describe('SearchRow Mobile Behavior', () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to desktop by default
    mockIsMobileNow.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mobile Button Layout', () => {
    it('shows Filter, Input, and Search button on mobile', () => {
      mockIsMobileNow.mockReturnValue(true);
      
      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      // Should have Filter button
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
      
      // Should have Search input
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      
      // Should have Search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeInTheDocument();
      
      // Should NOT have separate Clear button on mobile
      const clearButtons = screen.queryAllByRole('button', { name: /clear/i });
      expect(clearButtons.length).toBe(0);
    });

    it('shows inline clear icon when input has text on mobile', () => {
      mockIsMobileNow.mockReturnValue(true);
      
      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      
      // Type in search input
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      // Should show inline clear button (X icon)
      const clearIcon = screen.getByRole('button', { name: /clear search/i });
      expect(clearIcon).toBeInTheDocument();
    });
  });

  describe('Touch-Friendly Button Sizes', () => {
    it('ensures buttons have minimum 44px height on mobile', () => {
      mockIsMobileNow.mockReturnValue(true);
      
      const { container } = render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Check that buttons have min-h-[44px] class
      expect(filterButton.className).toContain('min-h-[44px]');
      expect(searchButton.className).toContain('min-h-[44px]');
    });
  });

  describe('Mobile Filter Sheet', () => {
    it('opens filter sheet when Filter button is clicked on mobile', async () => {
      mockIsMobileNow.mockReturnValue(true);
      
      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      
      await act(async () => {
        fireEvent.click(filterButton);
      });
      
      // Should show filter sheet dialog
      const filterSheet = screen.getByRole('dialog', { name: /search filters/i });
      expect(filterSheet).toBeInTheDocument();
      
      // Should have Apply and Reset buttons
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('closes filter sheet when backdrop is clicked', async () => {
      mockIsMobileNow.mockReturnValue(true);
      
      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      
      await act(async () => {
        fireEvent.click(filterButton);
      });
      
      // Find backdrop (fixed inset-0 div)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(backdrop!);
      });
      
      // Sheet should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /search filters/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Desktop Behavior', () => {
    it('shows Clear button on desktop', () => {
      mockIsMobileNow.mockReturnValue(false);
      
      render(<FlickletHeader onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      // Should have Clear button on desktop
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });
  });
});



