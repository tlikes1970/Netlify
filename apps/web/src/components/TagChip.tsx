/**
 * Process: Tag Chip
 * Purpose: Clickable tag component that filters posts feed via URL query params
 * Data Source: URL query params (?tags=foo,bar)
 * Update Path: Click → updates URL → router re-renders filtered feed
 * Dependencies: react-router, URLSearchParams
 */

import { useState, useEffect } from 'react';

interface TagChipProps {
  tag: string;
  active?: boolean;
  onClick?: (tag: string) => void;
}

export function TagChip({ tag, active: propActive, onClick }: TagChipProps) {
  const [active, setActive] = useState(propActive || false);

  // Sync with URL on mount and when URL changes
  useEffect(() => {
    const updateActiveFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      const tags = params.get('tags')?.split(',').filter(Boolean) || [];
      setActive(tags.includes(tag));
    };

    updateActiveFromURL();
    window.addEventListener('popstate', updateActiveFromURL);
    window.addEventListener('pushstate', updateActiveFromURL);

    return () => {
      window.removeEventListener('popstate', updateActiveFromURL);
      window.removeEventListener('pushstate', updateActiveFromURL);
    };
  }, [tag]);

  const handleClick = () => {
    if (onClick) {
      onClick(tag);
      return;
    }

    // Update URL with tag filter
    const params = new URLSearchParams(window.location.search);
    const currentTags = params.get('tags')?.split(',').filter(Boolean) || [];
    let newTags: string[];

    if (active) {
      // Remove tag if already active
      newTags = currentTags.filter((t) => t !== tag);
    } else {
      // Add tag if not active
      newTags = [...currentTags, tag];
    }

    // Update URL
    if (newTags.length > 0) {
      params.set('tags', newTags.join(','));
    } else {
      params.delete('tags');
    }

    const newSearch = params.toString();
    const newURL = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    
    window.history.pushState({}, '', newURL);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new CustomEvent('pushstate'));
  };

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        active ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: active ? 'var(--accent-primary)' : 'var(--layer)',
        color: active ? 'var(--text)' : 'var(--text)',
        borderColor: active ? 'var(--accent-primary)' : 'var(--line)',
        border: '1px solid',
      }}
      aria-label={`Filter by ${tag} tag`}
      aria-pressed={active}
    >
      {tag}
    </button>
  );
}

