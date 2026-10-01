import { describe, expect, it, vi } from 'vitest';
import { normalizeWatchStatus, WATCH_STATUS_LABELS } from '../watchStatus';
import { getAllSwipeActions, getSwipeConfig, getSwipeLabels } from '../swipeMaps';
import { Library } from '../storage';
import { setPrimaryStatus } from '../statusTransitions';
import { getPrimaryAction } from '@/features/compact/actionsMap';
vi.mock('../statusTransitions', () => ({setPrimaryStatus: vi.fn()}));
vi.mock('../flags', () => ({flag: () => true}));
vi.mock('../mobileFlags', () => ({isCompactMobileV1: () => true}));
vi.mock('../storage', () => ({Library: {move: vi.fn(), upsert: vi.fn()}}));
const item = {id: '1', title: 'Example', mediaType: 'movie' as const};
describe('canonical watch status', () => {
  it.each(['watching', 'wishlist', 'watched', 'not'] as const)('keeps persisted %s stable', status => expect(normalizeWatchStatus(status)).toBe(status));
  it('normalizes only the confirmed legacy alias', () => {
    expect(normalizeWatchStatus('want')).toBe('wishlist');
    for (const value of ['Watchlist', 'Watching', 'not-interested', 'remove', 'custom:family', null]) expect(normalizeWatchStatus(value)).toBeNull();
  });
  it('uses the canonical display vocabulary', () => expect(Object.values(WATCH_STATUS_LABELS)).toEqual(['Watching', 'Want to Watch', 'Watched', 'Not Interested']));
  it.each([
    ['watching', 'leftAction', 'watched', 'Watched'], ['watching', 'rightAction', 'wishlist', 'Want to Watch'],
    ['wishlist', 'leftAction', 'watching', 'Watching'], ['wishlist', 'rightAction', 'watched', 'Watched'],
    ['watched', 'leftAction', 'watching', 'Watching'], ['watched', 'rightAction', 'wishlist', 'Want to Watch'],
  ] as const)('%s %s uses the displayed destination', (tab, direction, target, label) => {
    vi.clearAllMocks();
    const config = getSwipeConfig(tab, item);
    expect(config[direction]?.label).toBe(label);
    config[direction]?.action(item);
    expect(Library.move).toHaveBeenCalledWith('1', 'movie', target);
    const hints = getSwipeLabels(tab);
    expect(direction === 'leftAction' ? hints.leftLabel : hints.rightLabel).toBe(label);
  });
  it('Start Watching in the compatibility Discovery helper saves Watching', () => {
    vi.clearAllMocks();
    const onWant = vi.fn();
    getAllSwipeActions('discovery', 'movie', {onWant}).find(a => a.label === 'Start Watching')!.action(item);
    expect(setPrimaryStatus).toHaveBeenCalledWith(item, 'watching');
    expect(onWant).not.toHaveBeenCalled();
  });
});

it('compact Start Watching fallback cannot call Want to Watch', () => {
  vi.clearAllMocks();
  const onWant = vi.fn();
  getPrimaryAction({...item, status: 'wishlist'}, 'tab-want', {onWant})!.onClick();
  expect(setPrimaryStatus).toHaveBeenCalledWith(expect.objectContaining({mediaType: 'movie'}), 'watching', {feedback: true});
  expect(onWant).not.toHaveBeenCalled();
});
