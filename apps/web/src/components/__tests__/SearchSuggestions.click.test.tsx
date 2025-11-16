import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchSuggestions from '../SearchSuggestions';

// Mock the enhanced autocomplete
vi.mock('../../search/enhancedAutocomplete', () => ({
  fetchEnhancedAutocomplete: vi.fn().mockResolvedValue([
    {
      id: '12345',
      title: 'Slow Horses',
      mediaType: 'tv',
      year: '2022',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'A spy thriller',
      voteAverage: 8.0,
    },
  ]),
}));

describe('SearchSuggestions - Click Behavior', () => {
  const mockOnSuggestionClick = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear search history
    localStorage.clear();
  });

  it('should include year in search query when clicking TMDB suggestion with year', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchSuggestions
        query="slow"
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    // Wait for suggestions to load
    await new Promise(resolve => setTimeout(resolve, 400));

    // Find the TMDB suggestion
    const suggestionButton = screen.getByText('Slow Horses');
    expect(suggestionButton).toBeInTheDocument();

    // Click the suggestion
    await user.click(suggestionButton);

    // Verify that the search query includes the year
    expect(mockOnSuggestionClick).toHaveBeenCalledWith('Slow Horses 2022');
  });

  it('should use title only when TMDB suggestion has no year', async () => {
    const user = userEvent.setup();
    
    // Mock autocomplete to return item without year
    vi.mock('../../search/enhancedAutocomplete', () => ({
      fetchEnhancedAutocomplete: vi.fn().mockResolvedValue([
        {
          id: '67890',
          title: 'Test Show',
          mediaType: 'tv',
          year: undefined,
          posterUrl: 'https://example.com/poster.jpg',
          synopsis: 'A test show',
          voteAverage: 7.5,
        },
      ]),
    }));

    render(
      <SearchSuggestions
        query="test"
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 400));

    const suggestionButton = screen.getByText('Test Show');
    await user.click(suggestionButton);

    // Should use title only when no year
    expect(mockOnSuggestionClick).toHaveBeenCalledWith('Test Show');
  });

  it('should handle search history clicks normally (no year)', async () => {
    const user = userEvent.setup();
    
    // Add to search history
    const history = [{ q: 'batman', ts: Date.now() }];
    localStorage.setItem('flicklet.search-history', JSON.stringify(history));

    render(
      <SearchSuggestions
        query="bat"
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    const historyButton = screen.getByText('batman');
    await user.click(historyButton);

    // History items should be passed as-is
    expect(mockOnSuggestionClick).toHaveBeenCalledWith('batman');
  });
});

