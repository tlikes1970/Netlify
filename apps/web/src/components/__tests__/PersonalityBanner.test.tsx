import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonalityBanner } from '../PersonalityBanner';

const mockResolveFlickletLine = vi.fn(() => 'Test personality line');
const mockSubscribe = vi.fn(() => () => {});

vi.mock('../../hooks/usePreferredName', () => ({
  usePreferredName: () => ({ preferredName: '', loading: false }),
}));

vi.mock('../../lib/settings', () => ({
  useSettings: () => ({ personalityLevel: 2 }),
  resolveFlickletLine: (...args: unknown[]) => mockResolveFlickletLine(...args),
}));

vi.mock('../../lib/storage', () => ({
  Library: {
    subscribe: (...args: unknown[]) => mockSubscribe(...args),
  },
}));

describe('PersonalityBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveFlickletLine.mockReturnValue('Test personality line');
  });

  it('renders home.header line without requiring username', () => {
    render(<PersonalityBanner />);

    expect(screen.getByTestId('personality-banner')).toBeInTheDocument();
    expect(screen.getByText('Test personality line')).toBeInTheDocument();
    expect(mockResolveFlickletLine).toHaveBeenCalledWith('home.header', 2, {
      username: undefined,
    });
  });

  it('does not render username setup CTA', () => {
    render(<PersonalityBanner />);

    expect(screen.queryByText(/set a username/i)).not.toBeInTheDocument();
  });
});
