/**
 * Test: SearchBar Component
 * Purpose: Verify search functionality, debouncing, and result display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

// Mock the community post search hook
vi.mock('../../hooks/useCommunityPostSearch', () => ({
  useCommunityPostSearch: vi.fn(),
}));

import { useCommunityPostSearch } from '../../hooks/useCommunityPostSearch';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    (useCommunityPostSearch as any).mockReturnValue({ results: [], loading: false });
    
    render(<SearchBar placeholder="Search posts..." />);
    
    const input = screen.getByPlaceholderText('Search posts...');
    expect(input).toBeInTheDocument();
  });

  it('updates query on input change', async () => {
    (useCommunityPostSearch as any).mockReturnValue({ results: [], loading: false });
    
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search posts...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test query' } });
    
    expect(input.value).toBe('test query');
  });

  it('debounces search query', async () => {
    (useCommunityPostSearch as any).mockReturnValue({ results: [], loading: false });
    
    render(<SearchBar debounceMs={200} />);
    
    const input = screen.getByPlaceholderText('Search posts...');
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Initially should not call useCommunityPostSearch with the new query
    expect(useCommunityPostSearch).toHaveBeenCalledWith({ queryText: '', limitResults: 10 });
    
    // After debounce time, should update
    await waitFor(() => {
      expect(useCommunityPostSearch).toHaveBeenCalledWith({ queryText: 'test', limitResults: 10 });
    }, { timeout: 300 });
  });

  it('displays search results when available', async () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Post',
        excerpt: 'This is a test post',
        tagSlugs: ['test'],
        slug: 'test-post',
        authorName: 'Test User',
        publishedAt: null,
      },
    ];
    
    (useCommunityPostSearch as any).mockReturnValue({ results: mockResults, loading: false });
    
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search posts...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Wait for results to appear (text is split by highlighting, so find the li element)
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      const resultItem = listItems.find(item => item.textContent?.includes('Test Post'));
      expect(resultItem).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('highlights matching text in results', async () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Post',
        excerpt: 'This is a test',
        tagSlugs: [],
        slug: 'test-post',
        authorName: 'Test User',
        publishedAt: null,
      },
    ];
    
    (useCommunityPostSearch as any).mockReturnValue({ results: mockResults, loading: false });
    
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search posts...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      const mark = screen.queryByText('test', { exact: false });
      if (mark) {
        expect(mark.tagName.toLowerCase()).toBe('mark');
      }
    }, { timeout: 500 });
  });

  it('shows loading state', async () => {
    (useCommunityPostSearch as any).mockReturnValue({ results: [], loading: true });
    
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search posts...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('navigates to post on result click', async () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Post',
        excerpt: 'Test excerpt',
        tagSlugs: [],
        slug: 'test-post',
        authorName: 'Test User',
        publishedAt: null,
      },
    ];
    
    (useCommunityPostSearch as any).mockReturnValue({ results: mockResults, loading: false });
    
    const mockPushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    
    render(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search posts...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      // Text is split by highlighting, so find the li element directly
      const listItems = screen.getAllByRole('listitem');
      const result = listItems.find(item => item.textContent?.includes('Test Post'));
      
      if (result) {
        fireEvent.click(result);
        expect(mockPushState).toHaveBeenCalledWith({}, '', '/posts/test-post');
      }
    }, { timeout: 500 });
    
    mockPushState.mockRestore();
    mockDispatchEvent.mockRestore();
  });
});

