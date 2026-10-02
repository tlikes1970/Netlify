import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LibrarySegmentBar from '@/components/LibrarySegmentBar';

const counts = {
  watching: 5,
  want: 2,
  watched: 10,
  mylists: 7,
};

describe('LibrarySegmentBar', () => {
  it('renders only the four remaining segments with unchanged counts', () => {
    render(
      <LibrarySegmentBar segment="watching" counts={counts} onChange={() => {}} />
    );

    expect(screen.getByRole('tab', { name: /Watching, 5 items/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Want to Watch, 2 items/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Watched, 10 items/i })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.queryByRole('tab', { name: /Up Next|Returning/i })).toBeNull();
    expect(screen.getByRole('tab', { name: /Custom Lists, 7 lists/i })).toBeTruthy();
  });

  it('calls onChange when a segment is selected', () => {
    const onChange = vi.fn();
    render(
      <LibrarySegmentBar segment="watching" counts={counts} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('tab', { name: /Custom Lists, 7 lists/i }));
    expect(onChange).toHaveBeenCalledWith('mylists');
  });
});
