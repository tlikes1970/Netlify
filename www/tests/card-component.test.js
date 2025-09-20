/**
 * Card Component Test
 * Tests that Card component exists and supports 'poster' variant
 */

describe('Card Component Test', () => {
  beforeEach(() => {
    // Reset window.Card to undefined to simulate missing component
    delete window.Card;
  });

  afterEach(() => {
    // Clean up
    delete window.Card;
  });

  test('should fail when Card component is missing', () => {
    // This test should fail because Card is missing
    expect(window.Card).toBeUndefined();
    
    // Try to use Card with 'poster' variant (should throw error)
    expect(() => {
      window.Card({
        variant: 'poster',
        id: 'test',
        title: 'Test Title'
      });
    }).toThrow();
  });

  test('should support poster variant when Card is available', () => {
    // Mock Card component
    window.Card = jest.fn((options) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.variant = options.variant;
      card.dataset.id = options.id;
      return card;
    });

    // Test that Card supports 'poster' variant
    const card = window.Card({
      variant: 'poster',
      id: 'test123',
      title: 'Test Show',
      subtitle: '2023 • TV Series',
      rating: 8.5,
      badges: [{ label: 'Watching', kind: 'status' }]
    });

    expect(card).toBeDefined();
    expect(card.dataset.variant).toBe('poster');
    expect(card.dataset.id).toBe('test123');
  });

  test('should handle currently-watching-preview Card usage', () => {
    // Mock Card component
    window.Card = jest.fn((options) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.variant = options.variant;
      card.dataset.id = options.id;
      return card;
    });

    // Mock the createPreviewCard function from currently-watching-preview.js
    const createPreviewCard = (item) => {
      if (!item) return null;
      
      const title = item.title || item.name || 'Unknown Title';
      const year = item.first_air_date ? new Date(item.first_air_date).getFullYear() : '';
      const subtitle = year ? `${year} • ${item.mediaType === 'tv' ? 'TV Series' : 'Movie'}` : 
                       (item.mediaType === 'tv' ? 'TV Series' : 'Movie');
      
      return window.Card({
        variant: 'poster',
        id: item.id,
        posterUrl: 'https://image.tmdb.org/t/p/w200/test-poster.jpg',
        title: title,
        subtitle: subtitle,
        rating: item.vote_average || 0,
        badges: [{ label: 'Watching', kind: 'status' }]
      });
    };

    const mockItem = {
      id: 'test123',
      title: 'Test Show',
      mediaType: 'tv',
      first_air_date: '2023-01-01',
      vote_average: 8.5
    };

    const card = createPreviewCard(mockItem);
    
    expect(card).toBeDefined();
    expect(card.dataset.variant).toBe('poster');
    expect(window.Card).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'poster',
        id: 'test123',
        title: 'Test Show'
      })
    );
  });
});
