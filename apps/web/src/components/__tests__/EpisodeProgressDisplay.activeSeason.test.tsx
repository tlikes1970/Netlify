import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EpisodeProgressDisplay } from '../EpisodeProgressDisplay';
import { CardMobileInfoSection } from '../cards/mobile/CardMobileInfoSection';
import CardV2 from '../cards/CardV2';
import { languageManager } from '../../lib/language';

const device = vi.hoisted(() => ({ desktop: false }));
vi.mock('../../lib/settings', () => ({ useSettings: () => ({ layout: { episodeTracking: true } }) }));
vi.mock('../../hooks/useDeviceDetection', () => ({ useIsDesktop: () => ({ ready: true, isDesktop: device.desktop }) }));
vi.mock('../SwipeableCard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('../MyListToggle', () => ({ default: () => null }));
vi.mock('../ListMembershipBadge', () => ({ ListMembershipBadge: () => null }));
vi.mock('../../features/compact/CompactPrimaryAction', () => ({ CompactPrimaryAction: () => null }));
vi.mock('../../features/compact/CompactOverflowMenu', () => ({ CompactOverflowMenu: () => null }));
vi.mock('../cards/mobile/ContextStatusActions', () => ({ ContextStatusActions: () => null }));

const item = { id: '42', mediaType: 'tv' as const, title: 'Dark Winds' };
const seasons = [
  { seasonNumber: 1, episodeNumbers: [1, 2] },
  { seasonNumber: 2, episodeNumbers: [1, 2, 3, 4, 5, 6] },
  { seasonNumber: 4, episodeNumbers: [1, 2] },
];
function save(episodes: Record<string, boolean>) {
  localStorage.setItem('episode-progress-42', JSON.stringify({ episodes, seasons }));
}
beforeEach(() => {
  localStorage.clear(); languageManager.setLanguage('en');
  device.desktop = false;
  save({ S2E1: true, S2E2: true, S2E3: true, S2E4: true });
});
afterEach(() => { cleanup(); languageManager.setLanguage('en'); });

it.each([320, 360, 390, 768, 1023])('phone/tablet production info section shows active-season summary at %ipx', width => {
  window.innerWidth = width;
  render(<CardMobileInfoSection item={item} tabKey="watching" metaLine="TV" providerMediaType="tv" />);
  expect(screen.getByText('Up next: S2 E5 · 4/6 watched')).toBeInTheDocument();
  expect(screen.queryByText(/S4 E/)).toBeNull();
});
it.each([1024, 1280])('desktop production card uses the same active season at %ipx', width => {
  window.innerWidth = width; device.desktop = true;
  render(<CardV2 item={item} context="tab-watching" />);
  expect(screen.getByText('Up next: S2 E5 · 4/6 watched')).toBeInTheDocument();
});
it('live episode update advances the displayed season without rewriting stored data', () => {
  render(<EpisodeProgressDisplay showId={42} compact />);
  save({ S2E1: true, S4E1: true });
  const saved = localStorage.getItem('episode-progress-42');
  act(() => window.dispatchEvent(new CustomEvent('episode-progress:updated', { detail: { showId: 42 } })));
  expect(screen.getByText('Up next: S4 E2 · 1/2 watched')).toBeInTheDocument();
  expect(localStorage.getItem('episode-progress-42')).toBe(saved);
});
it('Spanish summary uses the same active progress and count', () => {
  languageManager.setLanguage('es');
  render(<EpisodeProgressDisplay showId={42} compact />);
  expect(screen.getByText(/T2 E5.*4\/6/)).toBeInTheDocument();
  expect(screen.queryByText(/S4 E/)).toBeNull();
});
it('preserves Home preview presentation without adding an episode indicator', () => {
  device.desktop = true;
  render(<CardV2 item={item} context="home-cw-preview" />);
  expect(screen.queryByText(/4\/6 watched/)).toBeNull();
});
