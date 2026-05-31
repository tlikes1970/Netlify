import { describe, expect, it } from 'vitest';

import {
  mergeSettingsFromPayload,
  stripLegacySettingsFields,
  type Settings,
} from '../settings';

describe('settings legacy community cleanup', () => {
  it('stripLegacySettingsFields removes community from payloads', () => {
    const raw = {
      displayName: 'Pat',
      community: { followedTopics: ['drama', 'comedy'] },
    };
    const cleaned = stripLegacySettingsFields(raw);
    expect(cleaned).toEqual({ displayName: 'Pat' });
    expect('community' in cleaned).toBe(false);
  });

  it('mergeSettingsFromPayload ignores community and applies defaults', () => {
    const merged = mergeSettingsFromPayload({
      displayName: 'Pat',
      community: { followedTopics: ['horror'] },
      layout: { theme: 'light' as const },
    });
    expect(merged.displayName).toBe('Pat');
    expect(merged.layout.theme).toBe('light');
    expect('community' in (merged as Settings & { community?: unknown })).toBe(false);
    expect(merged.notifications.upcomingEpisodes).toBe(true);
  });
});
