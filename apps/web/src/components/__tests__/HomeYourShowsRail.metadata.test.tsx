import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import HomeYourShowsRail from '../rails/HomeYourShowsRail';
import { Library } from '../../lib/storage';
import { changeLanguage } from '../../lib/language';
import { mountSavedMetadataLanguageRefresh } from '../../lib/savedMetadataLanguage';
import * as metadataApi from '../../search/api';

vi.mock('../../lib/auth', () => ({ authManager: { getCurrentUser: () => null } }));
vi.mock('../../lib/readOnlyGuard', () => ({ guardMutation: () => true, isMutationBlocked: () => false }));
vi.mock('../../lib/settings', () => ({ useSettings: () => ({ personalityLevel: 2 }), resolveFlickletLine: () => '' }));
vi.mock('../../lib/statusTransitions', () => ({ setPrimaryStatus: vi.fn() }));
vi.mock('../../lib/confirmRemoveShow', () => ({ removeMediaItemWithConfirmation: vi.fn() }));
vi.mock('../cards/CardV2', () => ({ default: ({ item }: { item: { title: string; synopsis: string } }) => <article>{item.title}<p>{item.synopsis}</p></article> }));

let stop: () => void;
beforeEach(() => {
  changeLanguage('en');
  localStorage.clear();
  window.dispatchEvent(new Event('library:cleared'));
});
afterEach(() => {
  stop?.();
  cleanup();
  vi.restoreAllMocks();
  changeLanguage('en');
});
it.each([['en', 'es'], ['es', 'en']] as const)('Home saved preview updates live for %s → %s', async (from, to) => {
  changeLanguage(from);
  Library.upsert({ id: 7, mediaType: 'tv', title: 'Before', synopsis: 'Before synopsis' }, 'watching');
  vi.spyOn(metadataApi, 'fetchFullMediaMetadata').mockResolvedValue({ title: 'After', synopsis: 'After synopsis' });
  stop = mountSavedMetadataLanguageRefresh();
  render(<HomeYourShowsRail />);
  expect(screen.getByText('Before')).toBeInTheDocument();
  act(() => changeLanguage(to));
  await waitFor(() => expect(screen.getByText('After')).toBeInTheDocument());
  expect(screen.getByText('After synopsis')).toBeInTheDocument();
  expect(screen.queryByText('Before')).not.toBeInTheDocument();
});
