import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LibrarySegmentBar from '@/components/LibrarySegmentBar';

const counts = {
  watching: 5,
  want: 2,
  watched: 10,
  returning: 1,
  mylists: 7,
};

describe('LibrarySegmentBar', () => {
  it('renders all five segments with counts', () => {
    render(
      <LibrarySegmentBar segment="watching" counts={counts} onChange={() => {}} />
    );

    expect(screen.getByRole('tab', { name: /Currently Watching, 5 items/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Want to Watch, 2 items/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Watched, 10 items/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Up Next, 1 item/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Custom Lists, 7 items/i })).toBeTruthy();
  });

  it('calls onChange when a segment is selected', () => {
    const onChange = vi.fn();
    render(
      <LibrarySegmentBar segment="watching" counts={counts} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('tab', { name: /Custom Lists, 7 items/i }));
    expect(onChange).toHaveBeenCalledWith('mylists');
  });
});
