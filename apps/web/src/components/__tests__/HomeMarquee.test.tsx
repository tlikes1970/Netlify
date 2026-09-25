import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomeMarquee from '../HomeMarquee';

vi.mock('../../hooks/useDeviceDetection', () => ({
  useIsMobileScreen: () => true,
}));

describe('HomeMarquee on mobile', () => {
  it('renders the complete message as static wrapping copy', () => {
    render(<HomeMarquee messages={['Browsing has consumed more hours than several completed series.']} />);

    const message = screen.getByText('Browsing has consumed more hours than several completed series.');
    expect(message).toHaveClass('flicklet-marquee-track--static');
    expect(message).not.toHaveStyle({ transform: expect.stringContaining('translateX') });
  });
});
