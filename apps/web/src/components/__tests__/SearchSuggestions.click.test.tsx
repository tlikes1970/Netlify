import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchSuggestions from '../SearchSuggestions';
import { fetchEnhancedAutocomplete } from '../../search/enhancedAutocomplete';

function getDefaultSuggestions() {
  return [
    {
      id: '12345',
      title: 'Slow Horses',
      mediaType: 'tv',
      year: '2022',
      posterUrl: 'https://example.com/poster.jpg',
      synopsis: 'A spy thriller',
      voteAverage: 8.0,
    },
  ];
}

// Mock the enhanced autocomplete
vi.mock('../../search/enhancedAutocomplete', () => ({
  fetchEnhancedAutocomplete: vi.fn().mockResolvedValue(getDefaultSuggestions()),
}));

const mockedFetchEnhancedAutocomplete = vi.mocked(fetchEnhancedAutocomplete);

describe('SearchSuggestions - Click Behavior', () => {
  const mockOnSuggestionClick = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchEnhancedAutocomplete.mockReset();
    mockedFetchEnhancedAutocomplete.mockResolvedValue(getDefaultSuggestions());
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
    const suggestionButton = screen.getByRole('button', {
      name: /Slow Horses/i,
    });
    expect(suggestionButton).toBeInTheDocument();

    // Click the suggestion
    await user.click(suggestionButton);

    expect(mockOnSuggestionClick).toHaveBeenCalledWith('Slow Horses', '12345', 'tv');
  });

  it('should use title only when TMDB suggestion has no year', async () => {
    const user = userEvent.setup();
    
    mockedFetchEnhancedAutocomplete.mockResolvedValueOnce([
      {
        id: '67890',
        title: 'Test Show',
        mediaType: 'tv',
        year: undefined,
        posterUrl: 'https://example.com/poster.jpg',
        synopsis: 'A test show',
        voteAverage: 7.5,
      },
    ]);

    render(
      <SearchSuggestions
        query="test"
        onSuggestionClick={mockOnSuggestionClick}
        onClose={mockOnClose}
        isVisible={true}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 400));

    const suggestionButton = screen.getByRole('button', { name: /Test Show/i });
    await user.click(suggestionButton);

    // Should use title only when no year
    expect(mockOnSuggestionClick).toHaveBeenCalledWith('Test Show', '67890', 'tv');
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

    const historySection = screen.getByText('Recent Searches').closest('.mb-3');
    expect(historySection).not.toBeNull();
    const historyButton = within(historySection!).getByRole('button', {
      name: /batman/i,
    });
    await user.click(historyButton);

    // History items should be passed as-is
    expect(mockOnSuggestionClick).toHaveBeenCalledWith('batman', undefined, undefined);
  });
});

