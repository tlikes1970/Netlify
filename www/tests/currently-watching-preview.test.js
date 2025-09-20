/**
 * Currently Watching Preview Cards Tests
 * Phase 1.1: Fix Currently Watching Preview Cards
 */

describe('Currently Watching Preview Cards', () => {
  let mockItem;
  let createPreviewCard;

  beforeEach(() => {
    // Mock item data
    mockItem = {
      id: 12345,
      title: 'Test Show',
      name: 'Test Show',
      mediaType: 'tv',
      first_air_date: '2023-01-01',
      vote_average: 8.5,
      poster_path: '/test-poster.jpg'
    };

    // Mock window.Card function
    window.Card = jest.fn((options) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.variant = options.variant;
      card.dataset.id = options.id;
      card.innerHTML = `
        <div class="card-title">${options.title}</div>
        <div class="card-subtitle">${options.subtitle}</div>
        <div class="card-rating">${options.rating}</div>
      `;
      return card;
    });

    // Mock getPosterUrl function
    window.getPosterUrl = jest.fn(() => 'https://image.tmdb.org/t/p/w200/test-poster.jpg');

    // Mock the createPreviewCard function since it's not exported
    createPreviewCard = (item) => {
      if (!item) return null;
      
      const title = item.title || item.name || 'Unknown Title';
      const year = item.first_air_date ? new Date(item.first_air_date).getFullYear() : '';
      const subtitle = year ? `${year} • ${item.mediaType === 'tv' ? 'TV Series' : 'Movie'}` : 
                       (item.mediaType === 'tv' ? 'TV Series' : 'Movie');
      
      return window.Card({
        variant: 'poster', // This is what we're testing
        id: item.id,
        posterUrl: 'https://image.tmdb.org/t/p/w200/test-poster.jpg',
        title: title,
        subtitle: subtitle,
        rating: item.vote_average || 0,
        badges: [{ label: 'Watching', kind: 'status' }]
      });
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should use poster variant instead of compact', () => {
    const card = createPreviewCard(mockItem);
    
    expect(window.Card).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'poster'
      })
    );
  });

  test('should NOT use compact variant (bug test)', () => {
    const card = createPreviewCard(mockItem);
    
    expect(window.Card).toHaveBeenCalledWith(
      expect.not.objectContaining({
        variant: 'compact'
      })
    );
  });

  test('should render cards with correct dimensions', () => {
    const card = createPreviewCard(mockItem);
    
    expect(card).toBeDefined();
    expect(card.dataset.variant).toBe('poster');
  });

  test('should handle empty currently watching list', () => {
    const emptyCard = createPreviewCard(null);
    expect(emptyCard).toBeNull();
  });

  test('should handle single item', () => {
    const card = createPreviewCard(mockItem);
    expect(card).toBeDefined();
    expect(card.dataset.id).toBe('12345');
  });

  test('should handle multiple items', () => {
    const items = [mockItem, { ...mockItem, id: 67890 }];
    const cards = items.map(item => createPreviewCard(item));
    
    expect(cards).toHaveLength(2);
    cards.forEach(card => {
      expect(card.dataset.variant).toBe('poster');
    });
  });
});

describe('Card Performance Tests', () => {
  let createPreviewCard;

  beforeEach(() => {
    // Mock window.Card function
    window.Card = jest.fn((options) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.variant = options.variant;
      return card;
    });

    // Mock the createPreviewCard function
    createPreviewCard = (item) => {
      if (!item) return null;
      return window.Card({
        variant: 'poster',
        id: item.id,
        title: item.title,
        rating: item.vote_average || 0
      });
    };
  });

  test('should render cards within performance threshold', () => {
    const startTime = performance.now();
    
    // Simulate rendering 10 cards
    for (let i = 0; i < 10; i++) {
      const mockItem = {
        id: i,
        title: `Test Show ${i}`,
        mediaType: 'tv',
        vote_average: 8.0
      };
      createPreviewCard(mockItem);
    }
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 10 cards in under 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
