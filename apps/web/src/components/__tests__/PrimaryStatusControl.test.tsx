import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PrimaryStatusControl from '../PrimaryStatusControl';
import { Library } from '@/lib/storage';

describe('PrimaryStatusControl', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exposes the three authoritative user-controlled states', () => {
    render(<PrimaryStatusControl item={{ id: 7001, mediaType: 'tv', title: 'Example' }} />);
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual([
      'Set watch status…',
      'Currently Watching',
      'Want to Watch',
      'Watched',
    ]);
  });

  it('can save directly to Want to Watch', () => {
    vi.spyOn(Library, 'has').mockReturnValue(false);
    const upsert = vi.spyOn(Library, 'upsert').mockImplementation(() => undefined);
    render(<PrimaryStatusControl item={{ id: 7002, mediaType: 'movie', title: 'Saved Later' }} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'wishlist' } });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7002, title: 'Saved Later' }),
      'wishlist',
    );
  });
});
