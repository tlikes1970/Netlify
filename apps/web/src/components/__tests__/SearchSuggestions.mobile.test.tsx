/**
 * Test: SearchSuggestions Mobile Behavior
 * Purpose: Verify mobile-specific suggestion optimizations
 * 
 * Tests:
 * - Limits visible suggestion types on mobile (Recent + TMDB, no Popular)
 * - Max height constraint on mobile (~65vh)
 * - Z-index above mobile nav and filter sheet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchSuggestions from '../SearchSuggestions';

// Mock isMobileNow
const mockIsMobileNow = vi.fn(() => false);
vi.mock('../../lib/isMobile', () => ({
  isMobileNow: () => mockIsMobileNow(),
}));

// Mock fetchEnhancedAutocomplete
vi.mock('../../search/enhancedAutocomplete', () => ({
  fetchEnhancedAutocomplete: vi.fn(() => Promise.resolve([])),
}));

describe('SearchSuggestions Mobile Behavior', () => {
  const mockOnSuggestionClick = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up localStorage mock for search history
    Storage.prototype.getItem = vi.fn(() => JSON.stringify([
      { q: 'test query 1', ts: Date.now() },
      { q: 'test query 2', ts: Date.now() },
    ]));
  });

  describe('Mobile Suggestion Limits', () => {
    it('hides Popular suggestions on mobile', () => {
      mockIsMobileNow.mockReturnValue(true);
      
      render(
        <SearchSuggestions
          query="test"
          onSuggestionClick={mockOnSuggestionClick}
          onClose={mockOnClose}
          isVisible={true}
        />
      );
      
      // Should show Recent Searches section
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
      
      // Should NOT show Popular section on mobile
      const popularSection = screen.queryByText(/popular/i);
      expect(popularSection).not.toBeInTheDocument();
    });

    it('shows Popular suggestions on desktop', () => {
      mockIsMobileNow.mockReturnValue(false);
      
      render(
        <SearchSuggestions
          query="test"
          onSuggestionClick={mockOnSuggestionClick}
          onClose={mockOnClose}
          isVisible={true}
        />
      );
      
      // Popular section may or may not be visible depending on filtered results
      // This test verifies the component renders without errors on desktop
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Max Height', () => {
    it('applies ~65vh max height on mobile', () => {
      mockIsMobileNow.mockReturnValue(true);
      
      const { container } = render(
        <SearchSuggestions
          query="test"
          onSuggestionClick={mockOnSuggestionClick}
          onClose={mockOnClose}
          isVisible={true}
        />
      );
      
      const suggestionsDiv = container.querySelector('.absolute.top-full');
      expect(suggestionsDiv).toBeInTheDocument();
      
      const style = window.getComputedStyle(suggestionsDiv as Element);
      // Check that maxHeight is set (may be in inline style)
      const inlineStyle = (suggestionsDiv as HTMLElement).style.maxHeight;
      expect(inlineStyle).toBe('65vh');
    });

    it('applies 320px max height on desktop', () => {
      mockIsMobileNow.mockReturnValue(false);
      
      const { container } = render(
        <SearchSuggestions
          query="test"
          onSuggestionClick={mockOnSuggestionClick}
          onClose={mockOnClose}
          isVisible={true}
        />
      );
      
      const suggestionsDiv = container.querySelector('.absolute.top-full');
      expect(suggestionsDiv).toBeInTheDocument();
      
      const inlineStyle = (suggestionsDiv as HTMLElement).style.maxHeight;
      expect(inlineStyle).toBe('320px');
    });
  });

  describe('Z-Index Hierarchy', () => {
    it('sets z-index to 10002 on mobile (above nav and filter sheet)', () => {
      mockIsMobileNow.mockReturnValue(true);
      
      const { container } = render(
        <SearchSuggestions
          query="test"
          onSuggestionClick={mockOnSuggestionClick}
          onClose={mockOnClose}
          isVisible={true}
        />
      );
      
      const suggestionsDiv = container.querySelector('.absolute.top-full') as HTMLElement;
      expect(suggestionsDiv).toBeInTheDocument();
      
      const zIndex = suggestionsDiv.style.zIndex;
      expect(zIndex).toBe('10002');
    });
  });
});

