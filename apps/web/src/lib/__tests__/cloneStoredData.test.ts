import { expect, it, vi } from 'vitest';
import { cloneStoredData } from '../cloneStoredData';

it('clones nested persisted data when structuredClone is unavailable', () => {
  vi.stubGlobal('structuredClone', undefined);
  try {
    const original = { title: 'Título', tags: ['horror'], rating: 0, notes: null, optional: undefined, layout: { enabled: false } };
    const copy = cloneStoredData(original);
    expect(copy).toEqual(original);
    copy.tags.push('comedy');
    copy.layout.enabled = true;
    expect(original.tags).toEqual(['horror']);
    expect(original.layout.enabled).toBe(false);
    expect(copy).toHaveProperty('optional');
  } finally {
    vi.unstubAllGlobals();
  }
});

it.each([null, undefined, false, 0, 'texto'])('preserves primitive %s', value => {
  expect(cloneStoredData(value)).toBe(value);
});
